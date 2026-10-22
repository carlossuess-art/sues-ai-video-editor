"""Read-only permissions audit for private SUES library; never changes ownership or modes."""
import os
from pathlib import Path
from stat import S_ISDIR, S_ISREG, S_ISLNK

class PrivateLibraryPermissionError(RuntimeError):
    pass

def _permitted(stat_result, uid, gid, required):
    mode = stat_result.st_mode
    if uid == stat_result.st_uid:
        bits = (mode >> 6) & 7
    elif gid == stat_result.st_gid:
        bits = (mode >> 3) & 7
    else:
        bits = mode & 7
    return bits & required == required

def library_access_report(state, uid=1000, gid=1000):
    """Inspect only editor/jobs/assets and editor/jobs/library; return counts, no paths.

    This is not an authorization bypass. Root may read a file that the editor UID
    cannot; checking access bits prevents a release that would fail for that UID.
    """
    root = Path(state)
    if root.is_symlink() or not root.is_dir():
        raise PrivateLibraryPermissionError('Editor state unavailable')
    jobs = root / 'jobs'
    if jobs.is_symlink() or not jobs.is_dir():
        raise PrivateLibraryPermissionError('Editor jobs unavailable')
    blocked = {'assets': 0, 'library': 0}
    examined = {'assets': 0, 'library': 0}
    missing = []
    for name in ('assets', 'library'):
        base = jobs / name
        if not base.exists():
            missing.append(name)
            continue
        queue = [base]
        seen = 0
        while queue:
            path = queue.pop()
            st = path.lstat()
            seen += 1
            if seen > 10000:
                raise PrivateLibraryPermissionError('Excessive private library files')
            if S_ISLNK(st.st_mode) or not (S_ISDIR(st.st_mode) or S_ISREG(st.st_mode)):
                raise PrivateLibraryPermissionError('Unsupported entry in private library')
            if S_ISDIR(st.st_mode):
                needed = 5
                queue.extend(path.iterdir())
            else:
                needed = 4
            examined[name] += 1
            if not _permitted(st, uid, gid, needed):
                blocked[name] += 1
    return {
        'schema': 'sues-library-access-report/v1',
        'runtimeUid': uid,
        'runtimeGid': gid,
        'examined': examined,
        'blocked': blocked,
        'missing': missing,
        'ready': not any(blocked.values()) and not missing,
        'changesMade': False,
    }

def assert_library_readable(state, uid=1000, gid=1000):
    result = library_access_report(state, uid, gid)
    if not result['ready']:
        raise PrivateLibraryPermissionError(
            'Biblioteca privada no accesible para el runtime: '
            f"assets={result['blocked']['assets']}, "
            f"library={result['blocked']['library']}, "
            f"missing={','.join(result['missing']) or 'none'}. "
            'Requiere corrección autorizada de permisos antes del despliegue; '
            'no modificar accesos ni datos automáticamente.'
        )
    return result
