#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput -v 0
python manage.py seed

exec "$@"
