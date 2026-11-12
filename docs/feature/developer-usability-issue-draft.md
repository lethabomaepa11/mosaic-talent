# Unfiled bug report: developer journey and deployment packaging

GitHub CLI is signed out; this template-based draft has not been filed. Recheck existing issues before filing. Migration rollout already relates to [#129](https://github.com/lethabomaepa11/mosaic-talent/issues/129) and [#130](https://github.com/lethabomaepa11/mosaic-talent/issues/130).

**Describe the bug**
Optional GitHub setup appears mandatory. Ideator confuses empty/error states, reports refresh failures as failed saves, and lacks direct project navigation after conversion. The deploy image omits the migration runner, whose logging path depends on its working directory. Metadata describes a hiring/simulation product.

Live validation also found that signup accepts up to 128 password characters while the backend permits 32, and its route guard unmounts the form during submission, discarding field values and hiding rejected-submission errors. The owner approved those fixes as an additional part of this delivery.

**To Reproduce**
1. Open project creation without GitHub; compare the warning with actual repository requirements.
2. Fail the Ideator feed or refresh after a successful save.
3. Convert an idea and try to open its project directly.
4. Inspect the old Dockerfile: only the web host is published.
5. Invoke the old migrator from the repository root: logging configuration is not found.
6. Read the root page metadata.

**Expected behavior**
Developers can start from a problem/solution without GitHub. Failed requests offer retry, confirmed writes remain confirmed, converted projects can be opened, and deployment includes an independently executable migrator with reliable exit status.

**Screenshots**
Review the local preview at `http://localhost:3000`.

**Desktop (please complete the following information):**
- OS: Windows
- Browser: local Edge through Playwright
- Version: locally installed

**Smartphone (please complete the following information):**
- Device: 360px Playwright viewport
- OS: browser emulation
- Browser: Edge Chromium
- Version: locally installed

**Additional context**
Suggested priority: high for first contributions and rollout. Suggested owner: agent for engineering; project owner for local review and production deployment. See [implementation and validation](developer-usability-and-render-readiness.md).
