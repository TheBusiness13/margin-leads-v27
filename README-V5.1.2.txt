MarginBusiness Leads v5.1.2

Sending reliability changes:
- Runs a provider preflight before asking for final confirmation.
- A database/send-job recording error no longer prevents a valid provider send.
- Stores a local receipt immediately from the mail bridge response.
- Shows provider-accepted count, failed count and returned message IDs.
- Adds Verify last send, which reads permanent workspace email activity.
- Never marks leads sent when the provider response is uncertain.
- Clearly labels uncertain attempts as Not confirmed.
- Permanent send jobs remain best-effort audit records and no longer block delivery.

No new SQL migration is required beyond v5.1.
