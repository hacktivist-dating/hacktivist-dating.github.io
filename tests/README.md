# End-to-end tests (optional, dev only)

`e2e.py` drives the app in headless Chromium (Playwright for Python) and checks ~180 behaviours:
routes, navigation, raise-hand, mic, chat, host/moderator/listener permissions, gifts, wallet,
daily rewards, social graph, DMs, notifications, search, settings, persistence, deep links,
offline reload, guest restrictions and horizontal overflow.

```bash
pip install playwright && playwright install chromium
python3 tests/e2e.py 9601      # serves the project on that port and runs everything
```

These files are not needed to deploy the site.
