import subprocess, json, base64, os, sys
GH = os.path.expanduser("~/workspace/skills/github-pat/bin/ghapi")
def api(path):
    out = subprocess.run([GH, "GET", path], capture_output=True, text=True, timeout=180)
    if out.returncode != 0:
        raise RuntimeError(out.stderr[:300])
    return json.loads(out.stdout)
ref = sys.argv[1]
tree = api(f"/repos/hectorchanht/holdr/git/trees/{ref}?recursive=1")["tree"]
n = 0
for t in tree:
    if t["type"] != "blob": continue
    p = t["path"]
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    blob = api(f"/repos/hectorchanht/holdr/git/blobs/{t['sha']}")
    open(p, "wb").write(base64.b64decode(blob["content"]))
    n += 1
print("downloaded", n)
