import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

import extract_private_project as extractor


class ExtractTests(unittest.TestCase):
    def archive(self, root, entries, mode='w'):
        path = root / 'input.tar'
        with tarfile.open(path, mode=mode) as tar:
            for name, kind, data in entries:
                entry = tarfile.TarInfo(name)
                entry.type = kind
                if kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
                    entry.linkname = '../outside'
                entry.size = len(data) if kind == tarfile.REGTYPE else 0
                tar.addfile(entry, io.BytesIO(data) if kind == tarfile.REGTYPE else None)
        return path

    def test_regular_files_and_private_permissions(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = self.archive(root, [('./', tarfile.DIRTYPE, b''), ('./media', tarfile.DIRTYPE, b''), ('./media/original.media', tarfile.REGTYPE, b'voice'), ('./backup-manifest.json', tarfile.REGTYPE, b'{}')])
            target = root / 'out'
            extractor.extract(path, target)
            self.assertEqual((target / 'media/original.media').read_bytes(), b'voice')
            self.assertEqual((target / 'media/original.media').stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError):
                extractor.extract(path, target)

    def test_traversal_absolute_and_ambiguous_paths(self):
        for name in ('../outside', '/absolute', './a/../../outside', 'a//b', 'a/./b', 'a\\b', 'x/' * 5 + 'deep'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                path = self.archive(root, [(name, tarfile.REGTYPE, b'bad')])
                with self.assertRaises(ValueError):
                    extractor.extract(path, root / 'out')
                self.assertFalse((root / 'outside').exists())

    def test_links_fifo_devices_and_duplicate_files_are_rejected(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE, tarfile.BLKTYPE):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                path = self.archive(root, [('media', kind, b'')])
                with self.assertRaises(ValueError):
                    extractor.extract(path, root / 'out')
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = self.archive(root, [('same', tarfile.REGTYPE, b'one'), ('./same', tarfile.REGTYPE, b'two')])
            with self.assertRaises(ValueError):
                extractor.extract(path, root / 'out')

    def test_size_count_and_missing_manifest_limits(self):
        for limits in ({'MAX_BYTES': 2}, {'MAX_ENTRIES': 1}):
            with self.subTest(limits=limits), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                path = self.archive(root, [('one', tarfile.REGTYPE, b'123'), ('two', tarfile.REGTYPE, b'456')])
                with patch.multiple(extractor, **limits), self.assertRaises(ValueError):
                    extractor.extract(path, root / 'out')
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = self.archive(root, [('one', tarfile.REGTYPE, b'123')])
            with self.assertRaisesRegex(ValueError, 'manifiesto'):
                extractor.extract(path, root / 'out')

    def test_compressed_and_truncated_archives_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = self.archive(root, [('backup-manifest.json', tarfile.REGTYPE, b'{}')], mode='w:gz')
            with self.assertRaises(tarfile.TarError):
                extractor.extract(path, root / 'gzip')
            path = self.archive(root, [('media/original.media', tarfile.REGTYPE, b'x' * 4096)])
            path.write_bytes(path.read_bytes()[:700])
            with self.assertRaises((ValueError, tarfile.TarError)):
                extractor.extract(path, root / 'truncated')


if __name__ == '__main__':
    unittest.main()
