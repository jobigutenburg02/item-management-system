#!/bin/bash
python manage.py migrate
gunicorn django-item-api.wsgi:application