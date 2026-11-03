CAREER ORCHESTRATOR - PROFILE BACKEND INTEGRATION

This bundle contains the full clickable frontend plus the SAP CAP backend configured for local persistent SQLite storage.

SETUP (two VS Code terminals):
1) Extract this ZIP. Open the extracted SAP-Hackfest-career-orchestrator-frontend folder in VS Code.
2) Terminal 1: open career-backend folder and run: npm.cmd install, then npm.cmd start. Keep it running.
3) Terminal 2: in the parent frontend folder run: npm.cmd install, then npm.cmd start. Keep it running.
4) Open the local frontend URL printed by the Fiori tools server.
5) Open My Profile, enter name, email (optional), current role, years of experience and comma-separated skills; click Save Profile.
6) Refresh the frontend and open My Profile again. The saved values should load from CAP.

IMPORTANT:
- Backend API is http://localhost:4004/career/Profiles.
- The UI5 dev proxy is configured in ui5.yaml to forward /career to localhost:4004.
- Local profile data is stored in career-backend/db/career.db (not in-memory). Do not delete that file if you want to keep local test data.
- This does not implement secure user accounts/login yet; the current login/signup screens remain demo-only.
- SAP HANA is configured for the production profile, but requires an actual HANA Cloud instance and BTP service binding. Local testing uses SQLite.
