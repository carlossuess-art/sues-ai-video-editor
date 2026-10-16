import unittest
from types import SimpleNamespace
from face_landmarker import face_record

class ConversionTest(unittest.TestCase):
    def test_source_pixels_and_subject_eyes(self):
        points = [SimpleNamespace(x=.5, y=.5) for _ in range(478)]
        points[0] = SimpleNamespace(x=-.1, y=.2)
        points[1] = SimpleNamespace(x=1.1, y=.9)
        for i in (263, 362): points[i] = SimpleNamespace(x=.6, y=.4)
        for i in (33, 133): points[i] = SimpleNamespace(x=.4, y=.4)
        face = face_record(points, 100, 200)
        self.assertEqual(face['x'], 0)
        self.assertEqual(face['width'], 100)
        self.assertEqual(face['leftEye'], {'x':60., 'y':80.})
        self.assertEqual(face['rightEye'], {'x':40., 'y':80.})
        self.assertEqual(face['scoreKind'], 'presence-proxy-not-confidence')

if __name__ == '__main__': unittest.main()
