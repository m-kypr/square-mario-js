import os
import random
import string
from flask import Flask, send_from_directory, abort, request, jsonify

DIR = os.path.dirname(os.path.realpath(__file__))
JS_DIR = os.path.join(DIR, 'js')
ICO_DIR = os.path.join(DIR, 'ico')
HTML_DIR = os.path.join(DIR, 'html')
SOUND_DIR = os.path.join(DIR, 'sound')
CSS_DIR = os.path.join(DIR, 'css')
ANIM_DIR = os.path.join(DIR, 'animation')
ROOMS = []
app = Flask(__name__)


def uuid(length=8):
    return ''.join(random.choice(string.ascii_uppercase +
                                 string.ascii_lowercase + string.digits) for _ in range(length))


@ app.route("/sound/<path:path>")
def get_sound(path):
    r = send_from_directory(SOUND_DIR, path)
    r.mimetype = 'audio/mpeg'
    return r


@ app.route("/js/<path:path>")
def get_js(path):
    r = send_from_directory(JS_DIR, path)
    r.mimetype = 'application/javascript'
    return r


@ app.route("/css/<path:path>")
def get_css(path):
    r = send_from_directory(CSS_DIR, path)
    r.mimetype = 'text/css'
    return r


@ app.route("/animation/<path:path>")
def get_animation(path):
    r = send_from_directory(ANIM_DIR, path)
    r.mimetype = 'image/png'
    return r


@ app.route("/<path:path>")
def get_ico(path):
    if len(path.split('.ico')) > 1:
        r = send_from_directory(ICO_DIR, path)
        r.mimetype = 'image/x-icon'
        return r
    return abort(404)


@app.route("/login", methods=['GET', 'POST'])
def admin():
    if request.method == 'GET':
        r = send_from_directory(HTML_DIR, 'login.html')
        r.mimetype = 'text/html'
        return r
    if request.method == 'POST':
        if request.form:
            username = request.form['username']
            password = request.form['password']
            print(username, password)
            return "Your are logged in"
        return abort(400)
    return abort(404)


@app.route("/game")
def game():
    # <link rel="stylesheet" href="/css/mario.css">
    return """
    <script src=\"/js/mario.js\"></script>"""


@app.route("/settings")
def settings():
    r = send_from_directory(HTML_DIR, 'settings.html')
    r.mimetype = 'text/html'
    return r


@app.route('/room')
def room():
    new_uuid = uuid()
    while new_uuid in ROOMS:
        new_uuid = uuid()
    ROOMS.append(new_uuid)
    return jsonify({'uuid': new_uuid})


@app.route('/connect/<string:rid>')
def connect(rid):
    new_uuid = uuid()
    while new_uuid in ROOMS:
        new_uuid = uuid()
    ROOMS.append(new_uuid)
    return jsonify({'uuid': new_uuid})


@app.route('/rooms')
def rooms():
    return str(ROOMS)


@app.route("/")
def index():
    r = send_from_directory(HTML_DIR, 'start.html')
    r.mimetype = 'text/html'
    return r


host = '0.0.0.0'
port = 4555

app.run(host=host, port=port, debug=True)
