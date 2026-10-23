import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import update_service as updater


class UpdateTests(unittest.TestCase):
    def exercise(self, fail=False, busy=False, already=False, dependencies_changed=False, backup_failed=False, diagnostic=False, setup=False):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            old_release = root / 'release.old'
            old_release.mkdir()
            (root / 'editor').mkdir()
            (root / 'editor/jobs/assets').mkdir(parents=True)
            (root / 'editor/jobs/library').mkdir()
            for name in ('assets', 'library'):
                (root / 'editor/jobs' / name).chmod(0o755)
            (root / 'editor/project.json').write_text('{"existing":"project"}')
            (old_release / 'package-lock.json').write_text('{}')
            original = 'a' * 40
            target = original if already else 'b' * 40
            old = {'State': {'Running': True}, 'Config': {'Env': ['SUES_PUBLIC_ORIGIN=https://' + updater.HOST]}, 'Image': 'sha256:fixed',
                   'Mounts': [{'Destination': '/app', 'Source': str(old_release), 'RW': False}, {'Destination': '/state', 'Source': str(root / 'editor'), 'RW': True}]}
            calls = []
            created = False
            setup_record = None
            if setup:
                import time
                folder = root / 'login-credentials'; folder.mkdir()
                setup_record = folder / 'pending'; setup_record.write_text(json.dumps({'version':1,'tokenSha256':'e'*64,'expiresAt':int(time.time())+1800})); setup_record.chmod(0o600)
                (root / 'editor/access').mkdir()
                (root / 'editor/access/admin-password-hash').write_text('previous private hash')

            def run(*args, **kwargs):
                nonlocal created
                calls.append(args)
                if args[:2] == ('docker', 'create'):
                    if setup:
                        self.assertTrue(list(root.glob('update-backup-*/editor-state.manifest.json')))
                        self.assertEqual(json.loads((root/'editor/access/admin-setup.json').read_text())['tokenSha256'],'e'*64)
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
                return {'passwordSetupConfigured':True}

            helper = SimpleNamespace(editor_args=lambda value: ['docker', 'create', '--name', updater.EDITOR, 'sha256:fixed'], status=lambda *a, **k: '401' if '/api/health' in a[0] else '200')
            with patch.object(updater.os, 'chown') as ownership, patch.object(updater, 'ROOT', root), patch.object(updater, 'inspect', return_value=old), patch.object(updater, 'run', side_effect=run), patch.object(updater, 'health', side_effect=health), patch.object(updater, 'helper', return_value=helper), patch.object(updater.os, 'geteuid', return_value=0), patch.object(updater.time, 'sleep'):
                if fail or busy or dependencies_changed or backup_failed:
                    with self.assertRaises(RuntimeError):
                        updater.main(target, setup_record=str(setup_record) if setup_record else None)
                    self.assertFalse((root / 'servicio-commit.txt').exists())
                    if backup_failed:
                        self.assertIn(('docker', 'start', updater.EDITOR), calls)
                        self.assertFalse(any(c[:2] == ('docker', 'rename') for c in calls))
                        self.assertFalse(created)
                    elif fail:
                        self.assertTrue(any(c[:2] == ('docker', 'rename') and c[-1] == updater.EDITOR for c in calls))
                        self.assertIn(('docker', 'start', updater.EDITOR), calls)
                    else:
                        self.assertNotIn(('docker', 'stop', '--time', '45', updater.EDITOR), calls)
                else:
                    updater.main(target, diagnostic=diagnostic, setup_record=str(setup_record) if setup_record else None)
                    if already or diagnostic:
                        self.assertFalse(created)
                        self.assertFalse(any(c[:2] == ('docker', 'stop') for c in calls))
                        self.assertFalse(list(root.glob('update-backup-*')))
                    else:
                        self.assertEqual((root / 'servicio-commit.txt').read_text().strip(), target)
                        self.assertTrue(created)
                        archive = next(root.glob('update-backup-*/editor-state.tar'))
                        self.assertTrue(archive.is_file())
                        manifest = json.loads(archive.with_name('editor-state.manifest.json').read_text())
                        self.assertIn('editor/project.json', manifest['files'])
                if setup:
                    self.assertEqual((root/'editor/access/admin-password-hash').read_text(),'previous private hash')
                    if fail or backup_failed or busy:
                        self.assertFalse((root/'editor/access/admin-setup.json').exists())
                    else:
                        self.assertEqual((root/'editor/access/admin-setup.json').stat().st_mode & 0o777,0o600)
                        ownership.assert_called()
                        self.assertEqual(ownership.call_args.args[1:],(1000,1000))
                self.assertFalse(any('caddy' in ' '.join(c).lower() for c in calls))
                self.assertFalse(any(c[:2] == ('docker', 'rm') for c in calls))

    def test_setup_installed_only_after_verified_backup(self):
        self.exercise(setup=True)

    def test_setup_failure_preserves_original_password(self):
        self.exercise(setup=True, fail=True)

    def test_busy_editor_does_not_install_setup(self):
        self.exercise(setup=True, busy=True)

    def test_backup_failure_does_not_install_setup(self):
        with patch.object(updater, 'backup_state', side_effect=RuntimeError('backup failed')):
            self.exercise(setup=True, backup_failed=True)

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

    def test_diagnostic_checks_target_without_stopping_or_backing_up(self):
        self.exercise(diagnostic=True)

    def test_backup_failure_restarts_existing_editor_before_rename(self):
        with patch.object(updater, 'backup_state', side_effect=RuntimeError('backup failed')):
            self.exercise(backup_failed=True)

    def test_backup_rejects_symlink_and_verifies_real_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'editor').mkdir()
            (root / 'editor/source').write_bytes(b'private original')
            backup = root / 'backup'
            backup.mkdir()
            with patch.object(updater, 'ROOT', root):
                sha = updater.backup_state(backup)
                self.assertEqual(len(sha), 64)
                self.assertEqual(json.loads((backup / 'editor-state.manifest.json').read_text())['archiveSha256'], sha)
                (root / 'editor/external').symlink_to('/etc/hosts')
                with self.assertRaises(RuntimeError):
                    updater.backup_state(backup)


if __name__ == '__main__':
    unittest.main()
