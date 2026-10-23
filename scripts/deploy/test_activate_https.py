import copy
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch
import yaml
import activate_https as deploy


class MigrationTests(unittest.TestCase):
    def test_preserves_other_yaml_and_rejects_ambiguous_blocks(self):
        raw = 'services:\n  worker:\n    environment:\n      SECRET: ${SECRET}\n  caddy:\n    image: old\n    command: [old]\n  api:\n    image: api\nvolumes:\n  data: {}\n'
        replacement = deploy.replace_caddy(raw, {'network_mode': 'host'})
        left, right = yaml.safe_load(raw), yaml.safe_load(replacement)
        del left['services']['caddy']; del right['services']['caddy']
        self.assertEqual(left, right)
        self.assertIn('SECRET: ${SECRET}', replacement)
        with self.assertRaises(RuntimeError):
            deploy.replace_caddy(raw + '  caddy:\n    image: another\n', {})

    def exercise(self, fail=False, fail_restore=False, other_changed=False):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            compose_path = root / 'wa/compose.yml'
            compose_path.parent.mkdir()
            (root / 'editor/access').mkdir(parents=True)
            (root / 'editor/access/token').write_text('a' * 64)
            command = ['caddy', 'reverse-proxy', '--from', 'wa.suesholistics.com', '--to', 'whatsapp-connector:3001']
            raw = 'services:\n  caddy:\n    image: caddy:2.10-alpine\n    command: ' + json.dumps(command) + '\n  worker:\n    image: keep\n'
            compose_path.write_text(raw)
            old = {'Image': 'sha256:fixed', 'State': {'Running': True},
                   'Config': {'Cmd': ['node', 'scripts/app/start.mjs', '/state/project.json', '/state/jobs', '3010'], 'User': '1000:1000', 'Env': ['SUES_TOKEN_FILE=/state/access/token']},
                   'HostConfig': {'NetworkMode': 'host', 'ReadonlyRootfs': True},
                   'Mounts': [{'Destination': d, 'Type': 'bind', 'Source': str(root / str(i)), 'RW': d == '/state'} for i, d in enumerate(['/app', '/app/node_modules', '/state'])]}
            caddy = {'State': {'Running': True}, 'Args': command[1:], 'Config': {'Labels': {'com.docker.compose.project': 'sues-whatsapp'}}}
            calls = []

            def run(*args, **kwargs):
                calls.append(args)
                return types.SimpleNamespace(returncode=0, stdout='')

            def compose(path=compose_path, *args):
                calls.append(('compose', *args))
                if args[0] == 'config':
                    config = yaml.safe_load(Path(path).read_text())
                    if other_changed and Path(path) != compose_path:
                        config['services']['worker']['image'] = 'unexpected'
                    return types.SimpleNamespace(stdout=json.dumps(config))
                if fail_restore and compose_path.read_text() == raw:
                    raise RuntimeError('restore failure')
                return types.SimpleNamespace(stdout='')

            def status(url, **kwargs):
                if fail and url.startswith('https:'):
                    raise RuntimeError('certificate failure')
                return '401' if ':3001' in url or 'wa.sues' in url or '/api/' in url else '200'

            class Response:
                def __enter__(self):
                    return self
                def __exit__(self, *args):
                    pass
                def read(self):
                    return b'{"queue":{"rendering":0,"waiting":0,"saving":0}}'

            opener = types.SimpleNamespace(open=lambda *a, **kw: Response())
            with patch.object(deploy, 'ROOT', root), patch.object(deploy, 'COMPOSE', compose_path), patch.object(deploy, 'inspect', side_effect=lambda n: copy.deepcopy(old if n == deploy.EDITOR else caddy)), patch.object(deploy, 'run', side_effect=run), patch.object(deploy, 'compose', side_effect=compose), patch.object(deploy, 'status', side_effect=status), patch.object(deploy.urllib.request, 'build_opener', return_value=opener), patch.object(deploy.os, 'geteuid', return_value=0):
                if fail or other_changed:
                    with self.assertRaises(RuntimeError):
                        deploy.main()
                    self.assertEqual(compose_path.read_text(), raw)
                    self.assertFalse((root / 'https-backup-current.txt').exists())
                    if not other_changed:
                        self.assertIn(('docker', 'start', deploy.EDITOR), calls)
                        self.assertTrue(any(c[:2] == ('docker', 'rename') and c[-1] == deploy.EDITOR for c in calls))
                    else:
                        self.assertFalse(any(c[:2] == ('docker', 'stop') for c in calls))
                else:
                    deploy.main()
                    self.assertEqual(yaml.safe_load(compose_path.read_text())['services']['caddy']['network_mode'], 'host')
                    self.assertTrue((root / 'https-backup-current.txt').exists())

    def test_preserves_reviewed_memory_budget_without_changing_isolation(self):
        old = {'Image': 'sha256:fixed',
               'Config': {'Cmd': ['node', 'scripts/app/start.mjs', '/state/project.json', '/state/jobs', '3010'], 'User': '1000:1000', 'Env': []},
               'HostConfig': {'NetworkMode': 'host', 'ReadonlyRootfs': True},
               'Mounts': [{'Destination': d, 'Type': 'bind', 'Source': str(deploy.ROOT / str(i)), 'RW': d == '/state'} for i, d in enumerate(['/app', '/app/node_modules', '/state'])]}
        for budget in (1024**3, 1280 * 1024**2):
            old['HostConfig']['Memory'] = budget
            args = deploy.editor_args(old)
            self.assertEqual(args[args.index('--memory') + 1], str(budget))
            self.assertIn('--read-only', args)
            self.assertIn('no-new-privileges', args)
        old['HostConfig']['Memory'] = 4 * 1024**3
        with self.assertRaises(RuntimeError):
            deploy.editor_args(old)

    def test_success(self):
        self.exercise()

    def test_tls_failure_restores_both_services(self):
        self.exercise(fail=True)

    def test_editor_recovery_even_if_caddy_recovery_fails(self):
        self.exercise(fail=True, fail_restore=True)

    def test_unrelated_service_change_aborts_before_stop(self):
        self.exercise(other_changed=True)


if __name__ == '__main__':
    unittest.main()
