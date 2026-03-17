# SOS + Currency Enhancement TODO

- [x] Add backend SOS service module (`sos_service.py`) with contact storage + SMS wrapper + maps link formatter.
- [x] Extend `app.py` with `/register_contacts`, `/contacts`, and `/sos` endpoints (modular, no rewrite).
- [x] Extend `templates/index.html` with contact registration modal/form (preserve existing UI structure).
- [x] Extend `static/js/script.js` to handle contact registration and existing SOS flow with backend integration.
- [ ] Run backend API tests (`curl.exe`) for happy/error paths.
- [ ] Final compatibility review to ensure existing camera/detection/alerts/voice remain intact.
