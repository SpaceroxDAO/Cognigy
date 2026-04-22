# Valvoline Store Ops IVA — Demo Script

**Your persona:** Adam Boyle, Store Operations Manager, Store #1034, Newark NJ  
**Employee ID:** EMP-48825  
**Your phone (for xApp):** +1-848-466-8825  
**Total runtime:** ~6–8 minutes  

---

## OPENING

**[JANE]**
> "Thanks for calling Valvoline Store Ops Support, this is Jane. Can I get your store number and your name to get started?"

**[YOU]**
> "Sure — store number ten thirty-four, and my name is Adam Boyle."

_Jane will spell back your name and store number and ask you to confirm._

**[YOU]** _(confirming)_
> "That's right."

**[JANE]** — verifies you, confirms your role as Store Operations Manager at Store 1034 in Newark.

---
**CAPABILITY SHOWN: Employee Verification — internal auth gate before any action**

---

## SCENE 1 — CarFax Mileage Correction (xApp)

**[YOU]**
> "Hey, so one of my techs entered the wrong mileage on a vehicle this morning — the digits got transposed. I need to get that corrected with CarFax."

_Jane will ask for the VIN._

**[YOU]**
> "Yeah, the VIN is 1-H-G-B-H-4-1-J-X-M-N-1-0-9-1-8-6."

_Jane will spell it back digit by digit for confirmation._

**[YOU]** _(confirming)_
> "That's correct."

_Jane will ask for the service date._

**[YOU]**
> "It was today — April third."

_Jane will ask for the recorded mileage and the correct mileage._

**[YOU]**
> "The system shows forty-seven thousand eight hundred and thirty-two. The actual odometer read seventy-four thousand eight hundred and thirty-two. The tech transposed the digits."

_Jane will confirm and submit — then say she's texting you a confirmation form._

> **→ xApp form arrives on your phone. Show it to the audience.**  
> The form shows the VIN, the incorrect vs. correct mileage in red and green, your store and name, the reference number, and the CarFax timeline.

---
**CAPABILITY SHOWN: CarFax mileage correction workflow + xApp form delivered via SMS**

---

## SCENE 2 — Damage Claim Lookup

**[YOU]**
> "Actually while I have you — a customer called yesterday saying there was a scratch on their bumper after their visit last week. The front desk opened a claim. Can you pull that up? I think the claim ID is CLM-204871."

_Jane will look up the claim and read back the status._

**[YOU]** _(after Jane reads it back)_
> "Got it — and when is the adjuster supposed to reach back out to the customer?"

_Jane will confirm the estimated resolution date from the claim record._

**[YOU]**
> "Perfect, that's what I needed."

---
**CAPABILITY SHOWN: Existing damage claim lookup — post-service escalation workflow**

---

## SCENE 3 — New Damage Claim (Optional Extension)

> _Skip this scene if the demo is running long. Jump to Scene 4._

**[YOU]**
> "Actually, can I also file a new one? I just had another customer come in saying something happened during their oil change. Just want to get it on record."

_Jane will walk you through it — asking for customer name, service date, vehicle, and damage description._

**[YOU]**
> "Customer name is Sarah Torres. Service was this past Monday. Two thousand twenty-one Honda Civic. She says there's a crack on the windshield wiper arm."

_Jane will confirm each detail and submit the claim, giving you a new claim ID._

---
**CAPABILITY SHOWN: New damage claim filing — step-by-step intake with confirmation**

---

## SCENE 4 — Fleet Services

**[YOU]**
> "One more thing — I've got a fleet vehicle at the bay right now and the system is giving my tech a red light on the account. Can you check on the NJ Transit fleet account? I think the number is FLT-00234."

_Jane will ask what you need — tell her it's an authorization issue._

**[YOU]**
> "Yeah, it's an authorization issue — the vehicle isn't going through."

_Jane will pull the account and confirm status, vehicle count, service limits, and the account manager contact._

**[YOU]**
> "Okay so the limit isn't maxed out — sounds like it might be the VIN not being registered. Who do I call to get the vehicle added?"

_Jane will give you the account manager name and email from the fleet record._

---
**CAPABILITY SHOWN: Fleet account inquiry — real-time authorization check, contact routing**

---

## SCENE 5 — HR Routing

**[YOU]**
> "Hey, I've got an employee asking about taking a leave of absence — she's dealing with a family situation. I want to make sure I point her to the right place. What's the HR line for that?"

_Jane will confirm the issue category and route to the correct department with the phone number and what to have ready._

**[YOU]** _(after Jane responds)_
> "And is that line confidential if she calls herself, or does it go through me?"

_Jane will clarify that employees can call directly._

---
**CAPABILITY SHOWN: HR routing — category-based routing with actionable contact info**

---

## SCENE 6 — Application Status

**[YOU]**
> "Last thing — I'm expecting a candidate to come in for an interview this week. Can you pull up the application for Marcus Reid?"

_Jane will ask if you have the application ID or if she should search by name._

**[YOU]**
> "Just search by name — Marcus Reid, Store 1034."

_Jane will return the status: interview scheduled, date, time, and next step in the hiring process._

**[YOU]**
> "Great — and what happens after the interview on our end?"

_Jane will explain the next step: district manager review if the interview is successful, with the estimated decision date._

---
**CAPABILITY SHOWN: Application status — hiring pipeline visibility for store managers**

---

## CLOSE

**[YOU]**
> "That's everything, thank you Jane."

**[JANE]**
> Wraps up and offers further help.

---

## TIPS

- **Pause after each question.** Jane is streaming — let her finish before you jump in.
- **The xApp is your visual moment.** When the text hits your phone in Scene 1, open it and pass the phone around. That's the demo's biggest impression.
- **If Jane asks a clarifying question you didn't expect** — just answer naturally, she's doing her job.
- **If she misroutes** — it's easy to say "actually I need to check on a fleet account" and she'll pick up the right tool. Shows the conversational recovery.
- **Keep your lines natural.** You don't have to say the lines word-for-word. The personas and mock data are locked in — Jane will recognize your intent.

---

## QUICK REFERENCE — Demo Persona

| Field | Value |
|---|---|
| Name | Adam Boyle |
| Employee ID | EMP-48825 |
| Store | #1034 — Newark, NJ |
| Role | Store Operations Manager |
| Phone (xApp) | +1-848-466-8825 |
| Fleet Account | FLT-00234 (NJ Transit) |
| Damage Claim | CLM-204871 |
| Application | APP-309147 / Marcus Reid |
| VIN (mileage correction) | 1HGBH41JXMN109186 |
