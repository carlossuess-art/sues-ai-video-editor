import hashlib
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import background_update as background


class BackgroundTests(unittest.TestCase):
    def exercise_worker(self, checksum_ok=True, returncode=0, download_error=False):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            data = b'print("verified updater")\n'
            checksum = hashlib.sha256(data if checksum_ok else b'other').hexdigest()
            response = patch.object(background.urllib.request, 'urlopen', side_effect=OSError('network unavailable')) if download_error else patch.object(background.urllib.request, 'urlopen', return_value=io.BytesIO(data))
            with patch.object(background, 'BASE', base), response, patch.object(background.subprocess, 'run', return_value=SimpleNamespace(returncode=returncode)) as execute:
                code = background.worker('a' * 40, checksum, base)
            result = json.loads((base / 'result.json').read_text())
            expected = 1 if not checksum_ok or download_error else (128 - returncode if returncode < 0 else returncode)
            self.assertEqual(code, expected)
            self.assertEqual(result['exitCode'], expected)
            self.assertEqual(result['state'], 'SUCCESS' if expected == 0 else 'ERROR')
            self.assertEqual(execute.call_count, 0 if not checksum_ok or download_error else 1)

    def test_real_exit_status_is_propagated(self):
        for code in (0, 9, -15):
            with self.subTest(code=code):
                self.exercise_worker(returncode=code)

    def test_checksum_mismatch_never_executes_updater(self):
        self.exercise_worker(checksum_ok=False)

    def test_download_failure_is_recorded(self):
        self.exercise_worker(download_error=True)

    def test_launch_detaches_and_duplicate_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            base = root / 'background-update'
            calls = []
            def run(args, **kwargs):
                calls.append(args)
                return SimpleNamespace(returncode=0, stdout='active\n' if args[0] == 'systemctl' else '')
            with patch.object(background, 'ROOT', root), patch.object(background, 'BASE', base), patch.object(background.Path, 'is_dir', return_value=True), patch.object(background.shutil, 'which', return_value='/usr/bin/tool'), patch.object(background.subprocess, 'run', side_effect=run):
                background.launch('a' * 40, 'b' * 64)
                background.launch('a' * 40, 'b' * 64)
            launches = [c for c in calls if c[0] == 'systemd-run']
            self.assertEqual(len(launches), 1)
            self.assertIn('--service-type=exec', launches[0])
            self.assertIn('--property=Restart=no', launches[0])
            self.assertTrue(any(c.startswith('--property=StandardOutput=append:') for c in launches[0]))
            self.assertNotIn('--wait', launches[0])

    def test_systemd_launch_error_is_recorded(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            base = root / 'background-update'
            with patch.object(background, 'ROOT', root), patch.object(background, 'BASE', base), patch.object(background.Path, 'is_dir', return_value=True), patch.object(background.shutil, 'which', return_value='/usr/bin/tool'), patch.object(background.subprocess, 'run', return_value=SimpleNamespace(returncode=1, stdout='')):
                with self.assertRaisesRegex(RuntimeError, 'systemd rechazó'):
                    background.launch('a' * 40, 'b' * 64)
            latest = json.loads((base / 'latest.json').read_text())
            self.assertEqual(json.loads((Path(latest['directory']) / 'result.json').read_text())['stage'], 'systemd-launch')

    def test_invalid_release_is_rejected(self):
        with self.assertRaises(RuntimeError):
            background.validate('main', 'b' * 64)

    def test_worker_lock_prevents_concurrent_operations(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            with (base / 'worker.lock').open('a') as lock:
                background.fcntl.flock(lock, background.fcntl.LOCK_EX | background.fcntl.LOCK_NB)
                with patch.object(background, 'BASE', base), patch.object(background.urllib.request, 'urlopen') as fetch:
                    self.assertEqual(background.worker('a' * 40, 'b' * 64, base), 75)
                    fetch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
