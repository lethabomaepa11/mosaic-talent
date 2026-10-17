# Early peer review requests

Project members can request an anonymous peer review while a project is open or in progress after 14 days of membership. A request creates review assignments for the other project members and sends them the existing peer-review assignment notification. A member can request again 14 days after the previous request. Request eligibility is checked by the backend and the page explains how long remains when a request is not available.

Automatic all-team reviews after project completion remain in place as a distinct round. The peer-review assignment index is now non-unique, and early-request assignments are marked so completion reviews remain idempotent. The generated migration is `20261012004434_AllowRepeatedPeerReviewRequests`; apply it to the target database before enabling the feature.

Related issue: [#99](https://github.com/lethabomaepa11/mosaic-talent/issues/99).
