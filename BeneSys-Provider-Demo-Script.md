# BeneSys Provider Claims AI Agent — Demo Script

**Setup**: Open the BeneSys voice channel. You are playing the role of a billing coordinator at Lakeshore Regional Medical Center calling BeneSys to inquire about claims for a patient, Maria Gonzalez.

**Wow moments to watch for**: NPI/TIN digit-by-digit readback, EOB xApp card on the phone, CO-97 denial guidance, prior auth mismatch catch, eligibility confirmation.

---

## Scene 1: Call Opens / HIPAA Auth Gate

**[Call connects. Agent answers immediately -- no hold music, no menu.]**

**YOU SAY:**
> "Hi, I'm calling from Lakeshore Regional Medical Center. I need to check on a claim for one of our patients."

**AGENT WILL:** Ask for your NPI first, before sharing anything.

**YOU SAY:**
> "My NPI is 1-2-3-4-5-6-7-8-9-0."

**AGENT WILL:** Read it back digit by digit for confirmation.

**YOU SAY:**
> "Yes, that's correct."

**AGENT WILL:** Ask for your TIN.

**YOU SAY:**
> "Tax ID is 4-7, dash, 2-8-9-1-0-5-5."

**AGENT WILL:** Read it back and confirm.

**YOU SAY:**
> "Yes."

**[PAUSE FOR AUDIENCE]** *Point out: provider verified before a single piece of member data is shared. That's the HIPAA gate working. Every call, every time, no way to bypass it.*

---

## Scene 2: Claim Status — Paid Claim + EOB xApp

**AGENT WILL:** Confirm verification and ask how to help.

**YOU SAY:**
> "I need to check on claim CLM-2026-094721 for Maria Gonzalez."

**AGENT WILL:** Pull up the claim and read back status, amounts, and EFT details.

**[WATCH THE PHONE]** *The EOB card appears via text message -- tap it to show the audience the branded Explanation of Benefits with the payment breakdown, accumulators, and remittance info.*

**YOU SAY:**
> "Are there any other claims for this member? Any that are unpaid or denied?"

---

## Scene 3: Denied Claim Discovery — CO-97 MRI

**AGENT WILL:** Surface the denied claim for the December lumbar spine MRI, code CO-97.

**YOU SAY:**
> "Why was that denied?"

**AGENT WILL:** Explain CO-97 in plain language -- prior auth not obtained -- and introduce the two resolution paths.

**YOU SAY:**
> "Can you give me the exact denial code and reason?"

**AGENT WILL:** Read it back verbatim: CO-97, "Authorization not obtained prior to service."

**[PAUSE FOR AUDIENCE]** *This is the most common denial in the system. The agent didn't just say "denied" -- it explained the exact code, the reason, and is already surfacing next steps. A billing coordinator doesn't have to sit on hold with a claims rep to get this.*

**YOU SAY:**
> "Do I need to resubmit this? What do I need to fix?"

**AGENT WILL:** Explain the two options one at a time -- retrospective prior auth or ERISA appeal within 60 days.

---

## Scene 4: Prior Auth Check — Mismatch Catch

**YOU SAY:**
> "Was there a prior authorization on file for that MRI date of service?"

**AGENT WILL:** Check and return that there IS a prior auth on file -- but it's for orthopedic consult and PT, not the MRI. The MRI has no authorization.

**[PAUSE FOR AUDIENCE]** *This is the nuance. There's an auth in the system, but it's for a different procedure. The agent caught the mismatch without the provider having to dig through records. That's what AI does differently.*

---

## Scene 5: Eligibility Confirmation — Coverage + Benefit Check

**YOU SAY:**
> "Is this MRI even a covered service under this member's plan?"

**AGENT WILL:** Ask for date of birth to pull eligibility.

**YOU SAY:**
> "Date of birth is December 5th, 1988."

**AGENT WILL:** Confirm active coverage, plan name, coverage dates, and that the MRI is a covered service -- but requires prior authorization to be payable.

**YOU SAY:**
> "What's the member's deductible status?"

**AGENT WILL:** Report deductible met ($347.20 of $500) and out-of-pocket position.

**[PAUSE FOR AUDIENCE]** *In one call the provider now knows: claim was denied, why, what auth is on file, whether the member is covered, and where they stand on cost-sharing. That's four separate calls to a human rep, compressed into 90 seconds.*

---

## Scene 6: Duplicate Claim + Escalation

**YOU SAY:**
> "We may have submitted this claim twice. Can you check if claim 2-3-2-4-2-3-2 is a duplicate?"

**AGENT WILL:** Pull it up and confirm it matches the January 14th paid claim -- same claim, likely a duplicate submission.

**YOU SAY:**
> "Can you combine the two submissions into one?"

**AGENT WILL:** Explain that claim merging requires a void and corrected resubmission through the claims department, and offer to transfer.

**YOU SAY:**
> "Yes, please transfer me."

**AGENT WILL:** Route to a claims specialist with the reason pre-populated.

**[END OF DEMO]**

---

## What to Say to the Room

> "What you just saw is a provider call that would normally require three to four separate calls and fifteen to twenty minutes on hold. Jane handled eligibility, two claim lookups, a denial explanation with next steps, a prior auth cross-check, and a warm transfer -- all in under seven minutes, with HIPAA verification on every call automatically. No training required, no queue, available at 2am."

---

## Backup Questions

Use these if the audience wants to go deeper or test an edge case.

| Question to ask | What the agent does |
|---|---|
| "What happens if the member isn't eligible?" | Pulls eligibility showing a gap or termination |
| "Can it handle appeals?" | Explains the 60-day ERISA window and transfers to appeals |
| "I don't have the claim number" | Give just a date of service -- agent still finds the claim |
| "How do I enroll for ERA?" | Agent pulls ERA/EDI enrollment details from knowledge base |
| "What if I need to submit a new prior auth?" | Agent explains the submission process and offers to transfer to prior auth |
