---
title: Accessing Your Mentees
section: finding-your-mentees-and-sessions
description: How to find your assigned mentees, view their profiles, and manage your caseload on the Community Site.
media:
  src: assets/images/accessing-your-mentees/open-my-mentees.webm
  alt: Opening My Mentees from Appointment Management
  header: Opening My Mentees
steps:
  - title: Overview
    body: |
      To access your mentees, go to **Appointment Management** and then click **My Mentees**.
  - title: Understanding the My Mentees List
    body: |
      When you click **My Mentees**, you will be taken to a list of the young people currently assigned to you.

      In this list, the mentee's name appears in two places. This is intentional. Each name opens a different type of record.

      Click each **Joe Bloggs** name below to compare the shared **Client** record with your **Assigned Mentee Name** record.

      <div class="aur-mentee-picker" data-aur-mentee-picker aria-label="Assigned Mentees clickable example">
        <div class="aur-mentee-picker__list">
          <h4 class="aur-mentee-picker__heading">Assigned Mentees</h4>
          <div class="aur-mentee-picker__table" role="table" aria-label="Assigned Mentees example list">
            <div class="aur-mentee-picker__cell aur-mentee-picker__cell--head" role="columnheader">Client</div>
            <div class="aur-mentee-picker__cell aur-mentee-picker__cell--head" role="columnheader">Assigned Mentee Name</div>
            <div class="aur-mentee-picker__cell aur-mentee-picker__cell--head" role="columnheader">Mentee ID</div>
            <div class="aur-mentee-picker__cell" role="cell">
              <button class="aur-mentee-picker__link" type="button" data-aur-mentee-record="client" aria-pressed="true">Joe Bloggs</button>
            </div>
            <div class="aur-mentee-picker__cell" role="cell">
              <button class="aur-mentee-picker__link" type="button" data-aur-mentee-record="assigned" aria-pressed="false">Joe Bloggs</button>
            </div>
            <div class="aur-mentee-picker__cell" role="cell">MRVJV4</div>
          </div>
        </div>

        <div class="aur-mentee-picker__detail" aria-live="polite">
          <div class="aur-mentee-picker__selected">
            <span class="aur-mentee-picker__selected-label">Selected column</span>
            <strong class="aur-mentee-picker__selected-title">Client</strong>
            <span class="aur-mentee-picker__selected-type">Universal account</span>
          </div>
          <div class="aur-mentee-picker__panel" data-aur-mentee-panel="client">
            <ul class="aur-mentee-picker__bullets">
              <li><strong>Shared record</strong> for the young person.</li>
              <li>Other mentors may see this <strong>shared record</strong> if they also work with this mentee.</li>
              <li>Use this for <strong>general information</strong> about the young person.</li>
            </ul>
            <div class="aur-mentee-picker__important">
              <strong>Important</strong>
              <ul>
                <li>You will <strong>not be able to see another mentor's session notes here</strong>.</li>
                <li>Your own <strong>session notes</strong> and <strong>historic notes from the previous system</strong> are <strong>not stored under Client</strong>.</li>
                <li>For <strong>notes linked to your work with the mentee</strong>, click <strong>Assigned Mentee Name</strong> instead.</li>
              </ul>
            </div>
          </div>
          <div class="aur-mentee-picker__panel" data-aur-mentee-panel="assigned" hidden>
            <ul class="aur-mentee-picker__bullets">
              <li><strong>Mentor-specific record</strong> for this mentee.</li>
              <li>Visible to <strong>you as the mentor</strong>, and to <strong>SLT</strong> in the background if needed.</li>
              <li>Use this to find the link to their <strong>historic notes on Google Drive</strong>.</li>
              <li>Use this to see <strong>your session notes</strong> from sessions with this mentee.</li>
            </ul>
          </div>
        </div>
      </div>
  - title: Opening a Mentee Profile
    body: |
      To open a mentee's profile, click on their name. Inside the profile, you can view useful information about the young person, including background details that may help you prepare for sessions.
    media:
      - src: assets/images/accessing-your-mentees/open-mentee-profile.webm
        alt: Opening a mentee profile by clicking on the mentee name
  - title: Viewing the Full Form Submission
    body: |
      From the mentee's profile, you can also open the full form submission. This shows the information completed by the parent, school, or local authority when the young person was referred. This can help you understand more about the mentee before sessions begin.
    media:
      - src: assets/images/accessing-your-mentees/open-form-submission.webm
        alt: Opening the full form submission from the mentee profile
  - title: Accepting or Rejecting a Mentee
    body: |
      The mentee profile is where you decide whether to accept or reject a mentee. The **Accept** and **Reject** buttons are located at the top right of the mentee's profile.
    media:
      - src: assets/images/accessing-your-mentees/accept-or-reject-buttons.webm
        alt: Accept or reject mentee buttons shown on the top right of the mentee profile
  - title: What Accepting or Rejecting a Mentee Means
    body: |
      When a new mentee is assigned to you, the first step is to read their **form submission** carefully and attend the **initial parent/carer meeting**. You should only decide whether to accept or reject the mentee after both of these steps have taken place. The form submission on its own is **not enough** to decide whether the match is suitable.

      *Making Your Decision:* If the mentee feels like a **good fit**, you should **Accept** them. Once accepted, they will be added to your **caseload**. If the mentee does not feel like a good fit, you should **Reject** them. Once rejected, they will be returned to the assigning team so another match can be considered.
  - title: How New Mentees Are Added to Your Caseload — When a Mentee Leaves
    body: |
      There are two ways new mentees can be added to your caseload. If you have already set up your [operating hours](../availability/), and one of your mentees leaves, their time slot will become available again. For example, if you had a mentee every Monday from 9:00 to 10:00 and they leave, that slot will become free. If you do not add a blocker to that slot, it will remain available in your [operating hours](../availability/). This means the Assigning Team can use it to place a new mentee with you. You do not need to do anything else. If you have any questions, you can log a ticket with the Assigning Team using the [ticket system](../how-to-log-a-support-ticket/).
  - title: When You Add More Availability
    body: |
      The second way is when your availability changes and you are able to take on more sessions. If this happens, you should add the new time slots to your [operating hours](../availability/). This tells the system that you now have more unfilled availability. Once those extra slots have been added, they will appear in the assigning system and the Assigning Team will be able to place new mentees into them.
  - title: Off-Boarding a Mentee
    body: |
      If a mentee is leaving the service, you can off-board them from their profile. When you off-board a mentee, you will need to:

      - Select a reason for why they are leaving the service
      - Enter an end date for when they should be removed

      Once submitted, the mentee will be removed from your mentee list from that date.
    media:
      - src: assets/images/accessing-your-sessions/off-board-a-mentee.webm
        alt: Off-boarding a mentee from their profile
  - title: Important!
    marker: "!"
    variant: warning
    body: |
      <div class="aur-transfer-check">
        <p class="aur-transfer-check__lead"><strong>Check your mentee list carefully.</strong> As part of the data transfer from Google Workspace to Salesforce, there could be some discrepancies.</p>

        <div class="aur-transfer-check__items">
          <div class="aur-transfer-check__item">
            <strong>Mentees no longer with you?</strong>
            <span>Please <strong>off-board</strong> them.</span>
          </div>

          <div class="aur-transfer-check__item">
            <strong>New mentees missing from your list?</strong>
            <span>Please contact <strong>Assigning</strong> at the address below.</span>
          </div>

          <div class="aur-transfer-check__item">
            <strong>Address or contact details out of date?</strong>
            <span>Please contact a member of <strong>SLT</strong> with the mentee's name and the new contact information. A member of SLT will update this for you.</span>
          </div>
        </div>
      </div>
    copy_align: center
    copy:
      - label: "Email: assigning@mindjam.org.uk"
        value: assigning@mindjam.org.uk
---
