import contextlib
import hashlib
import io
import json
import tempfile
import time
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import configure_login as setup
import update_service as updater


class SetupTests(unittest.TestCase):
    def test_link_expires_and_only_hash_is_in_server_record(self):
        token, record = setup.create_setup()
        self.assertEqual(len(token), 64)
        self.assertNotIn(token, json.dumps(record))
        self.assertEqual(record['tokenSha256'], hashlib.sha256(token.encode()).hexdigest())
        self.assertTrue(time.time() < record['expiresAt'] <= time.time() + 1800)

    def test_preparation_keeps_plaintext_link_out_of_worker_arguments(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            body = b'# verified test launcher\n'
            calls = []
            fake = SimpleNamespace(launch=lambda *args, **kwargs: calls.append((args, kwargs)) or True)
            spec = SimpleNamespace(loader=SimpleNamespace(exec_module=lambda module: None))
            output = io.StringIO()
            with patch.object(setup, 'ROOT', root), patch.object(setup.Path, 'is_dir', return_value=True), patch.object(setup.urllib.request, 'urlopen', return_value=io.BytesIO(body)), patch.object(setup.importlib.util, 'spec_from_file_location', return_value=spec), patch.object(setup.importlib.util, 'module_from_spec', return_value=fake), contextlib.redirect_stdout(output):
                setup.prepare('a'*40, hashlib.sha256(body).hexdigest(), 'b'*64)
            pending = Path(calls[0][1]['setup_record'])
            link = pending.with_suffix('.url').read_text().strip()
            token = link.split('#setup=')[1]
            self.assertNotIn(token, pending.read_text())
            self.assertNotIn(token, str(calls))
            self.assertIn(link, output.getvalue())
            self.assertEqual(pending.stat().st_mode & 0o777, 0o600)
            self.assertEqual(pending.with_suffix('.url').stat().st_mode & 0o777, 0o600)
            self.assertEqual((root/'login-credentials').stat().st_mode & 0o777, 0o700)

    def test_prepared_record_rejects_symlinks_expiry_and_unsafe_permissions(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);folder=root/'login-credentials';folder.mkdir();record=folder/'pending';_,data=setup.create_setup();record.write_text(json.dumps(data));record.chmod(0o600)
            with patch.object(updater, 'ROOT', root):
                self.assertEqual(json.loads(updater.setup_candidate(record)),data)
                record.chmod(0o644)
                with self.assertRaises(RuntimeError): updater.setup_candidate(record)
                record.chmod(0o600);data['expiresAt']=int(time.time())-1;record.write_text(json.dumps(data))
                with self.assertRaises(RuntimeError): updater.setup_candidate(record)
                alias=folder/'link';alias.symlink_to(record)
                with self.assertRaises(RuntimeError): updater.setup_candidate(alias)
