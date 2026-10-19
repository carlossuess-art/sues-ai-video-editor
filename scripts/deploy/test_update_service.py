import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import update_service as updater


class UpdateTests(unittest.TestCase):
    def exercise(self, fail=False, busy=False, already=False, dependencies_changed=False):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            old_release = root / 'release.old'
            old_release.mkdir()
            (old_release / 'package-lock.json').write_text('{}')
            original = 'a' * 40
            target = original if already else 'b' * 40
            old = {'State': {'Running': True}, 'Config': {'Env': ['SUES_PUBLIC_ORIGIN=https://' + updater.HOST]}, 'Image': 'sha256:fixed',
                   'Mounts': [{'Destination': '/app', 'Source': str(old_release), 'RW': False}, {'Destination': '/state', 'Source': str(root / 'editor'), 'RW': True}]}
            calls = []
            created = False

            def run(*args, **kwargs):
                nonlocal created
                calls.append(args)
                if args[:2] == ('docker', 'create'):
                    created = True
                if args[0] == 'git' and 'checkout' in args:
                    (Path(args[2]) / 'package-lock.json').write_text('{"changed":true}' if dependencies_changed else '{}')
                stdout = ''
                if args[0] == 'git' and 'rev-parse' in args:
                    stdout = original if str(old_release) in args else target
                if args[:2] == ('docker', 'run'):
                    mount = next(x for x in args if isinstance(x, str) and ',dst=/app,' in x)
                    source = mount.split('src=')[1].split(',')[0]
                    self.assertTrue((Path(source) / 'node_modules').is_dir())
                return SimpleNamespace(returncode=0, stdout=stdout)

            def health():
                if busy:
                    raise RuntimeError('Hay trabajos activos')
                if fail and created:
                    raise RuntimeError('broken server')

            helper = SimpleNamespace(editor_args=lambda value: ['docker', 'create', '--name', updater.EDITOR, 'sha256:fixed'], status=lambda *a, **k: '401' if '/api/health' in a[0] else '200')
            with patch.object(updater, 'ROOT', root), patch.object(updater, 'inspect', return_value=old), patch.object(updater, 'run', side_effect=run), patch.object(updater, 'health', side_effect=health), patch.object(updater, 'helper', return_value=helper), patch.object(updater.os, 'geteuid', return_value=0), patch.object(updater.time, 'sleep'):
                if fail or busy or dependencies_changed:
                    with self.assertRaises(RuntimeError):
                        updater.main(target)
                    self.assertFalse((root / 'servicio-commit.txt').exists())
                    if fail:
                        self.assertTrue(any(c[:2] == ('docker', 'rename') and c[-1] == updater.EDITOR for c in calls))
                        self.assertIn(('docker', 'start', updater.EDITOR), calls)
                    else:
                        self.assertNotIn(('docker', 'stop', '--time', '45', updater.EDITOR), calls)
                else:
                    updater.main(target)
                    if already:
                        self.assertFalse(created)
                    else:
                        self.assertEqual((root / 'servicio-commit.txt').read_text().strip(), target)
                        self.assertTrue(created)
                self.assertFalse(any('caddy' in ' '.join(c).lower() for c in calls))

    def test_update_preserves_proxy_and_prepares_nested_mount(self):
        self.exercise()

    def test_failure_recovers_previous_container(self):
        self.exercise(fail=True)

    def test_running_jobs_reject_before_mutation(self):
        self.exercise(busy=True)

    def test_dependency_change_rejects_before_stopping(self):
        self.exercise(dependencies_changed=True)

    def test_current_version_does_not_restart(self):
        self.exercise(already=True)


if __name__ == '__main__':
    unittest.main()
