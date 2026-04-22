# Hearst Technology Services — Employee IT FAQ

Internal knowledge base for the HTS AI Assistant (Jane). Last updated: April 2026. Source: HTS TechHelp SharePoint. Managed by Hearst Technology Services.

## Account Access and Identity

Hearst uses Okta as its Single Sign-On platform. Your Okta account gives you access to all Hearst applications including Microsoft 365, Slack, Concur, Workday, and Salesforce through a single login. Your Okta username is your Hearst email address. Accounts are provisioned when you join and deprovisioned on your last day. If you need access to a new application, submit an Access Request in ServiceNow and your manager will receive an approval email. To access your Okta dashboard, go to hearst.okta.com and sign in with your Hearst email and password.

## Password and Account Policies

Passwords must be at least 12 characters with a mix of upper, lower, numbers, and special characters. Passwords expire every 90 days. After 5 failed login attempts, your Okta account locks automatically. To unlock: use the self-service portal or contact IT. MFA is required for all Hearst applications. Supported MFA methods: Okta Verify push (recommended), SMS, hardware token.

## Multi-Factor Authentication

Hearst supports Okta Verify push notifications (recommended), time-based one-time codes via Okta Verify, SMS text codes, and hardware YubiKey tokens for high-security roles. To enroll a new device after getting a new phone, ask Jane to reset your MFA or submit a ticket in ServiceNow under Okta MFA Reset. If you lose your phone and cannot complete MFA, call the HTS Service Desk at 1-800-HTS-HELP with your employee ID ready. If you receive an Okta push notification you did not request, deny it immediately and change your password, then report it to security at hearst.com.

## VPN and Remote Access

To connect to the Hearst VPN, use the Cisco AnyConnect client. Download it from the HTS TechHelp Confluence site. You need your Okta credentials to authenticate. If VPN is slow, try switching to a different gateway: US-East for East Coast employees, US-West for West Coast, and EU for employees in Europe. For VPN issues, check that your Okta MFA is working first, as VPN requires MFA. Common fix: disconnect, fully close AnyConnect, and reconnect. Microsoft 365 apps like Teams and Outlook do not require VPN since they are cloud-based. VPN is required for internal Hearst web applications, on-premises file shares, and any URL with a hearst.internal address.

## Wi-Fi and Network

Corporate Wi-Fi network name is Hearst-Corp and requires your Active Directory credentials. Guest Wi-Fi is Hearst-Guest with no password. If you cannot connect to Hearst-Corp, try forgetting the network and reconnecting. Ethernet connections are available at all office desks and require no special configuration. If the ethernet port at your desk is not working, submit a Hardware ticket in ServiceNow with your floor and desk number. Do not connect corporate devices to Hearst-Guest.

## Mac Devices

Company Macs are managed through JAMF. To install approved software on your Mac, open JAMF Self Service from your Applications folder and browse the catalog. Software not listed in Self Service requires a formal Software Request via ServiceNow. If your Mac is running slow, check disk usage by going to Apple menu, About This Mac, then Storage. If disk usage is over 85 percent, clear the Trash, remove downloads, and move files to OneDrive. For macOS updates, wait for the JAMF notification rather than using System Preferences directly. Do not disable or uninstall CrowdStrike Falcon, which is Hearst's endpoint security tool running on all managed Macs.

## Windows Devices

Company Windows laptops are managed through Microsoft Intune. To install software, open Company Portal from the Start menu and browse the approved catalog. If Windows prompts you to enroll in Intune, follow the steps to complete enrollment. For BitLocker recovery issues, call the HTS Service Desk at 1-800-HTS-HELP immediately with your device serial number. Do not install software downloaded from the internet without IT approval.

## Disk Space and Device Management

Company devices are managed through JAMF on Mac and Intune on Windows. If your disk is over 85 percent full, you will receive an alert. To free space: empty Trash or Recycle Bin, clear browser cache, move large files to OneDrive, remove unused applications. For persistent issues, IT can run a remote cleanup. OneDrive sync issues are common after OS updates. Fix: pause sync, sign out of OneDrive, sign back in, and resume sync.

## Mobile Devices

To set up Hearst email on your iPhone or Android device, install the Microsoft Outlook app and sign in with your Hearst email address. You will be prompted to enroll in Intune, which is required to access Hearst email on personal devices. Intune creates a separate work container on your device and only manages Hearst data, not your personal apps or files. If you lose your phone, contact the HTS Service Desk immediately so IT can remotely wipe your Hearst data from the device. Corporate-owned smartphones are issued to specific roles and require a Hardware Request in ServiceNow with manager approval.

## Email and Outlook

Your Hearst email address is firstname.lastname at hearst.com. Each mailbox includes 100 GB of storage. To set up an Out of Office reply, go to File, Automatic Replies in Outlook desktop or the Settings gear in Outlook on the web. To join or create a distribution list, submit a request in ServiceNow. If your calendar is not syncing between Outlook desktop and mobile, sign out of the Outlook app and sign back in. To share your calendar with a colleague, right-click your calendar in Outlook, select Sharing Permissions, and add their name. Hearst IT will never ask for your password by email.

## Microsoft Teams

Hearst primarily uses Microsoft Teams for all internal meetings and communications. To join a Teams meeting, click the Join Microsoft Teams Meeting link in the calendar invite. If Teams is crashing, clear the cache by closing Teams, navigating to the Teams cache folder, deleting the cache files, and relaunching. For audio issues during calls, check Device Settings in Teams to confirm the correct microphone and speaker are selected. Teams meetings can accommodate up to 1,000 participants. For town halls and all-hands events over 1,000 attendees, contact the communications team to set up a Teams Live Event. To record a meeting, click the More menu and select Start Recording. All participants are notified automatically when recording starts.

## Microsoft 365 and OneDrive

Each Hearst employee has 5 TB of OneDrive storage. Always save work files to OneDrive or a SharePoint document library rather than your local desktop. To fix OneDrive sync errors, pause sync, sign out, sign back in with your Hearst email, and resume. To restore a deleted file, open OneDrive and go to the Recycle Bin, where files are kept for 93 days. To share a large file that is too big for email, upload it to OneDrive and share the link instead. Microsoft 365 web apps are available at office.com if the desktop apps are not installed.

## Software Requests

To request new software, submit a Service Request in ServiceNow under Software Installation. Common pre-approved software includes Microsoft 365, Adobe Creative Cloud, Slack, Zoom, Salesforce, Jira, Confluence, and Concur. Non-standard software requires manager approval and a security review. Typical turnaround is 1 to 2 business days for pre-approved software and 5 to 7 business days for non-standard software. Software not available in JAMF Self Service or Company Portal must go through a formal ServiceNow request. Software licenses are managed by HTS and should never be renewed personally on a credit card.

## Printing and Scanning

Hearst printers are named using the format PRN-FL followed by floor number and unit number. On managed devices connected to Hearst-Corp Wi-Fi, printers are discoverable automatically. Add a printer through System Preferences on Mac or Settings on Windows and search for your floor's printer name. To scan a document to email, use the Scan to Email function on the printer touchscreen and enter your Hearst email address. For confidential documents, use Follow-Me Printing, which holds your print job until you authenticate at the printer with your badge. If the printer is out of paper or toner, check the storage closet on your floor first, then submit a Facilities ticket in ServiceNow if supplies are fully depleted.

## Conference Rooms and Audio Visual

Book conference rooms through Outlook or Teams calendar by adding the room as a location when scheduling a meeting. To connect your laptop to a conference room display, most rooms use wireless presentation via Barco ClickShare. Install the ClickShare app from JAMF Self Service or Company Portal. For wired connections, use the HDMI or USB-C cable on the conference table. If the AV system is not working, check that the room is booked in Outlook and press the touchscreen panel to wake the system. For all-hands events or meetings with over 50 attendees, submit an Event Support request in ServiceNow at least 2 weeks in advance.

## ServiceNow and Help Desk

To submit an IT support ticket, ask Jane directly in this chat, visit the HTS TechHelp portal on SharePoint, or call 1-800-HTS-HELP. An Incident is when something that was working has stopped working. A Service Request is when you need something new or changed. Priority levels range from P1 Critical with a 15-minute response time to P4 Low with a 1-business-day response. To check ticket status, ask Jane with your ticket number or log in to the ServiceNow self-service portal. To escalate a ticket, reply to the ticket update email and request escalation, or have your manager escalate on your behalf.

## Common ServiceNow Categories

Incident categories include Hardware, Software, Network, Account Access, Email, VPN, Printing, and Phone and Voicemail. Service Request categories include Software Installation, Hardware Request, Access Request, Account Changes, Distribution List, New Hire Setup, and Offboarding. Change Requests require Change Advisory Board approval for production changes. Using the correct category helps route your ticket to the right team faster.

## Phishing and Security

If you receive a suspicious email, do not click any links or attachments. Forward it to phishing at hearst.com. Common phishing signs include urgent language, unfamiliar senders, misspelled domain names, and requests for credentials. Hearst uses Sumo Logic for security monitoring and CrowdStrike Falcon for endpoint protection on all managed devices. If you clicked a suspicious link, change your Okta password immediately and contact the security team at security at hearst.com and call 1-800-HTS-SECU. If you find a USB drive in the office, do not plug it in. Turn it in to the nearest HTS tech or reception desk. Report all security concerns, even if you are not sure.

## Concur and Expense Reports

Expense reports are submitted through SAP Concur. Access Concur at the Concur portal using Okta SSO. Submit reports within 30 days of the expense. Attach receipts for any expense over 25 dollars. Mileage reimbursement rate is 67 cents per mile. International expenses: use the exchange rate from the date of the transaction. Expense report approval typically takes 3 to 5 business days. For Concur questions, check the Finance Confluence FAQ first. Alcohol expenses must be submitted under Business Entertainment, not Meals, and cannot exceed 30 percent of the total meal bill.

## Travel Booking

All business travel must be booked through SAP Concur Travel to access Hearst corporate rates. Do not book through Expedia or airline websites directly without VP approval. Hearst has negotiated rates with United, American, Delta, Marriott, Hilton, and National Car Rental. Economy class is required for flights under 6 hours. Business class requires VP approval and is permitted for international flights over 6 hours. For international travel, complete the Hearst international travel safety registration form in the HTS TechHelp portal at least 2 weeks before your trip.

## Payroll and Time Off

Payroll and time-off systems vary by Hearst division. Hearst Magazines and Hearst Television use Workday. Hearst Newspapers uses ADP. Fitch Ratings uses SAP SuccessFactors. For your specific portal, check MyHearst or ask Jane with your division name. Direct deposit changes must be submitted at least 5 business days before payday. W-2s are available in your payroll portal by January 31st each year. PTO requests require manager approval and must be submitted through your division's payroll system.

## Home Office Equipment Stipend

Full-time employees at the Senior Associate level and above receive a 500 dollar annual home office equipment stipend. The stipend resets every January 1st and unused balance does not carry over. Eligible purchases include monitors, keyboards, mice, webcams, headsets, ergonomic chairs, standing desk converters, and USB hubs. Non-eligible items include personal computers, mobile phones, tablets, gaming equipment, and personal software subscriptions. To use the stipend, submit an Office Supply Request through Jane or the IT portal on MyHearst, or purchase the item yourself and submit it in Concur under the Home Office Equipment Stipend category.

## New Hire Onboarding

New employees receive their laptop and credentials on day one. Your manager or HR will provide your employee ID. To set up your accounts: first, activate your Okta account using the welcome email link. Then set up MFA in Okta using the Okta Verify app. Sign into Microsoft 365 and Teams. Access MyHearst portal for company policies and benefits. Request additional software through the ServiceNow service catalog. Within your first 30 days, complete the Information Security Awareness Training and Acceptable Use Policy acknowledgment in Workday Learning. If your Okta activation email never arrived, check your spam folder or call the HTS Service Desk to resend it.

## Offboarding

When an employee leaves Hearst, all system access is revoked within 24 hours of the termination date. All Hearst-owned equipment must be returned within 5 business days of the last day. IT will provide a prepaid shipping label for remote employees. Set your Out of Office reply in Outlook before your last day, directing contacts to your manager. Email forwarding can be set up by your manager via a ServiceNow ticket for up to 90 days. Hearst work files, client data, and confidential documents may not be taken at departure.

## Distribution Lists

To create or manage email distribution lists, ask Jane or submit a request in ServiceNow. New lists require a name, description, and initial member list. You must be the owner of a list to add or remove members. Changes take effect within 5 minutes. Common lists follow the format team-name at hearst.com.

## People Search

You can look up any Hearst employee by name, department, or title. Results include name, role, department, division, supervisor, location, email, phone, and employment status. People search does not require authentication for basic lookups. The employee directory is also available on the MyHearst intranet under the People section.

## MyHearst Intranet

MyHearst is Hearst's internal employee portal, available at myhearst.hearst.com or through your Okta dashboard. It is the central hub for company news, HR resources, IT guides, benefits information, division updates, and the employee directory. IT policies, the Acceptable Use Policy, and the AI Use Policy are published on MyHearst under IT Policies. Critical company-wide announcements are posted on the MyHearst homepage and sent via email and the All-Hearst Teams channel.

## Slack

Hearst Slack is available through your Okta dashboard. You will be automatically added to your division's primary channels and the company-wide general and announcements channels. Hearst channel naming follows the format division-team-purpose, for example hm-digital-design for Hearst Magazines Digital Design. External Slack Connect requires formal IT approval and cannot be set up ad hoc. To manage notification overload, set notification schedules and Do Not Disturb hours in Slack Preferences. Slack is not the primary meeting tool at Hearst; use Microsoft Teams for video calls and scheduled meetings.

## Zoom

Hearst primarily uses Microsoft Teams for internal video meetings. Zoom is available as a secondary tool for external meetings with clients who prefer it. To get a Zoom account, submit a Software Request in ServiceNow with a business justification. Cloud recording in Zoom requires HTS approval. Local recording is permitted if all participants verbally consent at the start of the meeting.

## Adobe Creative Cloud

Adobe Creative Cloud licenses are provisioned by role and are available to employees in editorial, design, photo, and video roles. To install Creative Cloud, open JAMF Self Service on Mac or Company Portal on Windows and search for Adobe Creative Cloud. Sign in with your Hearst-issued Adobe ID, which is your Hearst email address. Do not sign in with a personal Adobe account on a managed device. If your Adobe apps are asking you to re-activate, submit a Software License Renewal ticket in ServiceNow. Adobe CC licenses allow installation on up to 2 devices, but only one active session at a time.

## Salesforce

Hearst uses Salesforce Sales Cloud and Service Cloud across multiple divisions. To get access, submit an Access Request in ServiceNow and confirm with your manager which Salesforce org you need. Hearst Salesforce uses Okta SSO, so there is no separate Salesforce password. Records deleted in Salesforce go to the Recycle Bin for 15 days and can be restored during that time. For pipeline views, account details, and deal approvals, ask Jane and she will pull the information directly from Salesforce.

## Confluence and Knowledge Management

Confluence is Hearst's team documentation platform for wikis, process guides, project notes, and internal FAQs. It is separate from SharePoint. SharePoint is used for file storage and formal documents; Confluence is for living, collaborative documentation. Confluence is available through your Okta dashboard. Standard employees have read access to most spaces. Write access to a specific space is granted by the space admin. To find content, use the global search in Confluence with Ctrl K on Windows or Command K on Mac.

## Data Storage and File Management

Always save work files to OneDrive or a SharePoint document library, not to your local desktop or Downloads folder. OneDrive provides 5 TB of storage per employee and syncs automatically. For team files that multiple people edit, use a SharePoint library or a Teams channel Files tab. Hearst's data retention policy requires general business files to be kept for 7 years, financial records for 10 years, and published content indefinitely. Legal holds override all deletion policies. To share files over 25 MB, upload to OneDrive and share the link rather than attaching to email.

## Hearst Divisions and Systems

Hearst's major divisions include Hearst Magazines, which publishes Cosmopolitan, Esquire, Good Housekeeping, Elle, and Harper's Bazaar among others. Hearst Newspapers operates 24 daily newspapers including Houston Chronicle and San Francisco Chronicle. Hearst Television owns and operates 33 TV stations across the US. Fitch Ratings is Hearst's global credit ratings agency and has some separate IT systems due to its regulatory environment. Hearst Entertainment and Syndication includes A+E Networks and King Features Syndicate. For division-specific systems like editorial CMS tools or broadcast software, contact your division's IT team directly. Corporate systems including Okta, email, Concur, and Workday are supported by HTS for all divisions.

## Accessibility and Accommodations

To request IT accessibility accommodations such as specialized keyboards, screen readers, or ergonomic peripherals, contact HR at accessibility at hearst.com or your HR Business Partner. HR will involve HTS to procure and configure the appropriate technology. This process is confidential and typically takes 5 to 10 business days. Hearst supports NVDA and JAWS for Windows screen reader users and the built-in VoiceOver on Mac. Microsoft 365 and ServiceNow meet WCAG 2.1 AA accessibility standards.

## IT Policies and AI Use

The Hearst Acceptable Use Policy governs all use of Hearst IT resources and is available on MyHearst under IT Policies. Hearst systems are for business use and all activity is logged and auditable. The Hearst Generative AI Policy permits use of Microsoft Copilot for Microsoft 365 as the primary approved AI tool since it is enterprise-protected. Public AI tools such as ChatGPT, Claude, and Gemini may be used for generic research but must not receive confidential Hearst content, unpublished editorial work, or client data. If you accidentally share confidential data with a public AI tool, report it immediately to security at hearst.com.

## Emergency and After-Hours Support

For critical IT issues outside business hours, call 1-800-HTS-HELP and select Emergency Support. The 24/7 on-call team handles outages, security incidents, data breaches, and issues blocking broadcast or publication deadlines. For security emergencies including confirmed data breaches or active intrusions, call 1-800-HTS-SECU. Check the HTS Status Page at status.hearst.com for known outages and subscribe to updates. If you are on a deadline and your system fails, call 1-800-HTS-HELP and say deadline emergency to trigger escalation to a senior technician immediately.
