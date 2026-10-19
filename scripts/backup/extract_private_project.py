#!/usr/bin/env python3
"""Extract bounded regular files/directories from a SUES uncompressed TAR."""
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tarfile

MAX_BYTES = 512 * 1024 * 1024
MAX_ENTRIES = 150

def extract(archive, destination):
    target = Path(destination)
    if target.exists():
        raise ValueError('El destino de recuperación debe ser nuevo')
    target.mkdir(mode=0o700)
    total = 0
    seen = set()
    with tarfile.open(archive, mode='r:') as source:
        for count, member in enumerate(source, 1):
            if count > MAX_ENTRIES:
                raise ValueError('La copia contiene demasiados archivos')
            name = member.name
            if name in ('.', './') and member.isdir():
                continue
            if name.startswith('./'):
                name = name[2:]
            name = name.rstrip('/') if member.isdir() else name
            parts = name.split('/')
            if (not re.fullmatch(r'[a-zA-Z0-9_./-]+', name) or
                    any(p in ('', '.', '..') for p in parts) or
                    len(parts) > 4 or len(name) > 200 or name in seen):
                raise ValueError('La copia contiene una ruta no permitida')
            seen.add(name)
            if (not (member.isdir() or member.isfile()) or member.issparse() or
                    member.size < 0 or member.size > MAX_BYTES):
                raise ValueError('La copia contiene enlaces o entradas no permitidas')
            if name.endswith('.json') and member.size > 8 * 1024 * 1024:
                raise ValueError('Un archivo de análisis supera 8 MiB')
            total += member.size
            if total > MAX_BYTES:
                raise ValueError('La copia descomprimida supera 512 MiB')
            path = target.joinpath(*PurePosixPath(name).parts)
            path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            if member.isdir():
                path.mkdir(mode=0o700, exist_ok=True)
                continue
            incoming = source.extractfile(member)
            if incoming is None:
                raise ValueError('No se pudo leer un archivo de la copia')
            remaining = member.size
            with incoming, path.open('xb') as output:
                os.chmod(path, 0o600)
                while remaining:
                    block = incoming.read(min(1024 * 1024, remaining))
                    if not block:
                        raise ValueError('La copia está incompleta')
                    output.write(block)
                    remaining -= len(block)
    if not (target / 'backup-manifest.json').is_file():
        raise ValueError('Falta el manifiesto del proyecto SUES')

if __name__ == '__main__':
    try:
        os.umask(0o077)
        if len(sys.argv) != 3:
            raise ValueError('Se necesitan archivo TAR y destino nuevo')
        extract(sys.argv[1], sys.argv[2])
    except (ValueError, OSError, tarfile.TarError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
