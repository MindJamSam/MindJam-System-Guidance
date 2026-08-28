---
title: Using Calendar Events
section: understanding-the-difference
description: How to create, view, and manage calendar events and bookings for mentoring sessions. Includes session statuses such as attended, cancelled, late notice cancellation, and mentee no-show.
steps:
  - title: Overview
    body: |
      Before adding events, it is helpful to know that the Salesforce calendar works a little differently from Google Calendar. Some parts may feel less familiar at first, but once you know where to click, it becomes much easier to use. For example:

      - to move an event, you edit the event details rather than dragging and dropping it
      - event status is shown using a small coloured square in the title, rather than changing the colour of the full event
  - title: How to Add a Calendar Event
    body: |
      Each hour in the calendar is split into two sections:

      - click the **top half** if the session starts on the hour
      - click the **bottom half** if the session starts at half past

      This will open a flow where you can enter the event details.
    media:
      - src: assets/images/using-calendar-events/split1.png
        alt: Each calendar hour split into top half (on the hour) and bottom half (half past)
  - title: Event Details
    body: |
      <div class="aur-calendar-details">
        <div class="aur-calendar-details__head">
          <p class="aur-calendar-details__lead">Add the key information first, then choose the event type that matches the work you are recording.</p>
          <button type="button" class="aur-copy aur-calendar-details__copy" data-aur-copy="https://meet.new/" aria-label="Copy Google Meet URL: https://meet.new/">
            <span class="aur-copy__icon" aria-hidden="true">
              <svg class="aur-copy__icon-default" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
                <rect x="9" y="9" width="11" height="11" rx="2"/>
                <path d="M5 15V6a2 2 0 0 1 2-2h9"/>
              </svg>
              <svg class="aur-copy__icon-done" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </span>
            <span class="aur-copy__label">
              <span class="aur-copy__label-default">Google Meet URL: https://meet.new/</span>
              <span class="aur-copy__label-done">Copied</span>
            </span>
          </button>
        </div>

        <div class="aur-calendar-details__layout">
          <div class="aur-calendar-details__fields">
            <div class="aur-calendar-details__field">
              <span class="aur-calendar-details__label">Event Name</span>
              <p>Use anything clear. The mentee's full name is usually easiest to find later.</p>
              <span class="aur-calendar-details__example">Example: Joe Bloggs session</span>
            </div>

            <div class="aur-calendar-details__field">
              <span class="aur-calendar-details__label">Description</span>
              <p>If you are using Google Meet, paste the meeting link here.</p>
              <span class="aur-calendar-details__example">https://meet.new/</span>
            </div>
          </div>

          <div class="aur-calendar-details__types">
            <div class="aur-calendar-details__types-title">Type options</div>

            <div class="aur-calendar-details__type-row">
              <span class="aur-calendar-details__type-name">Mentoring &amp; Other Paid Work</span>
              <ul>
                <li><strong>MindJam Mentoring:</strong> normal sessions at your hourly rate.</li>
                <li><strong>Other Paid Work:</strong> work that is not mentoring, paid at your hourly rate.</li>
              </ul>
            </div>

            <div class="aur-calendar-details__type-row">
              <span class="aur-calendar-details__type-name">Group Sessions</span>
              <ul>
                <li><strong>Adventure Guild:</strong> D&amp;D sessions.</li>
                <li><strong>Group Session:</strong> standard group sessions.</li>
              </ul>
            </div>

            <div class="aur-calendar-details__type-row">
              <span class="aur-calendar-details__type-name">Fixed Rate Meetings (£40)</span>
              <ul>
                <li><strong>Meeting (Charged), Official Meeting, Report (Charged):</strong> formal meetings or reports charged at a fixed rate.</li>
              </ul>
            </div>

            <div class="aur-calendar-details__type-row">
              <span class="aur-calendar-details__type-name">Non-Chargeable / Internal</span>
              <ul>
                <li><strong>Report, Parent/Carer Meeting, Personal Time:</strong> internal use, initial meetings, or blockers. These are not billed.</li>
              </ul>
            </div>
          </div>
        </div>

        <p class="aur-calendar-details__ignore"><strong>Types to Ignore:</strong> BlockJam Counselling, Counselling, and Training may appear in the list, but mentors should ignore them.</p>
      </div>
  - title: Mentee Field
    body: |
      This field links the event to a specific mentee. When you click into the **Mentee Field** you will see a dropdown of all your mentees. If your mentee does not appear, press **Enter** on your keyboard to open a window with all your mentees. If the event is for a mentoring session or other work connected to a young person, make sure you select the correct mentee here. If no mentee is added, the system will not know who the event is for. If you are creating a Personal Time event or another event not linked to a young person, such as Other Paid Work, you do not need to add a mentee.

      - *Session Group* — If this is a group session, use the **Session Group** field instead of selecting an individual mentee. Only do this if it is a group session event.
      - *Start Time and End Time* — Enter the time the event starts and ends.
  - title: Repeat and Other Fields
    body: |
      - *Repeat* — If the **session repeats**, you can choose how often: **weekly, monthly, or yearly**. If needed, you can also add an **end date** for the series. We encourage setting repeating sessions to **end in September**. This can save time during the **summer holidays**, when you may otherwise need to **cancel lots of sessions one by one**.
      - *Related To and System Information* — You can ignore these fields. **Please do not change them.**

      Once everything is complete, click **Save**.
  - title: Important
    body: |
      When an event is created, the system also creates a Service Appointment in the background. This can take up to 40 seconds. If you do not see the Service Appointment straight away, wait a moment and check again.
  - title: After the Event Has Been Created
    body: |
      When you click on a calendar event, you will see some useful links and options.

      - *Service Appointment* — Use this when you need to complete the wrap up, confirm attendance, or update the session status.
      - *Edit or More Details* — Use this when you need to change the time, date, or other event details, or to delete the event.

      If you need to move a session, open the event and edit the start or end date and time. If the change only applies once, choose **this event**. If the change applies to the full repeating series, choose **the series**.
  - title: Deleting an Event
    body: |
      <div class="aur-delete-demo__intro">
        <p>To delete an event, open it and use the <strong>Delete Series</strong> option. Despite the name, this does more than one thing. You will then be asked whether you want to delete:</p>

        <ul>
          <li>just this event, or</li>
          <li>this event and the following series</li>
        </ul>

        <p>So even though the button says Delete Series, you can still choose to remove only one event.</p>
      </div>

      <div class="aur-delete-demo" data-aur-delete-demo data-delete-preview="single">
        <div class="aur-delete-demo__top">
          <span class="aur-delete-demo__button-label">Delete Series Example</span>
          <p>If you only need to delete one session, choose <strong>Just this event</strong>. If you want to delete that session and all future sessions in the same series, choose <strong>This event and following series</strong>.</p>
        </div>

        <div class="aur-delete-demo__choices" role="group" aria-label="Delete Series preview options">
          <button type="button" class="aur-delete-demo__choice" data-delete-mode="single" aria-pressed="true">Just this event</button>
          <button type="button" class="aur-delete-demo__choice" data-delete-mode="following" aria-pressed="false">This event and following series</button>
        </div>

        <div class="aur-delete-demo__calendar" aria-label="Weekly session preview">
          <span class="aur-delete-demo__corner">Time</span>
          <span class="aur-delete-demo__day">Mon</span>
          <span class="aur-delete-demo__day">Tue</span>
          <span class="aur-delete-demo__day aur-delete-demo__day--current">Wed</span>
          <span class="aur-delete-demo__day">Thu</span>
          <span class="aur-delete-demo__day">Fri</span>

          <span class="aur-delete-demo__time">9:00-10:00</span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>

          <span class="aur-delete-demo__time">10:00-11:00</span>
          <span class="aur-delete-demo__cell"><span class="aur-delete-demo__session aur-delete-demo__session--past" aria-label="Monday session remains"></span></span>
          <span class="aur-delete-demo__cell"><span class="aur-delete-demo__session aur-delete-demo__session--past" aria-label="Tuesday session remains"></span></span>
          <span class="aur-delete-demo__cell aur-delete-demo__cell--current"><span class="aur-delete-demo__session aur-delete-demo__session--current" aria-label="Wednesday selected session"></span></span>
          <span class="aur-delete-demo__cell"><span class="aur-delete-demo__session aur-delete-demo__session--future" aria-label="Thursday future session"></span></span>
          <span class="aur-delete-demo__cell"><span class="aur-delete-demo__session aur-delete-demo__session--future" aria-label="Friday future session"></span></span>

          <span class="aur-delete-demo__time">11:00-12:00</span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>

          <span class="aur-delete-demo__time">12:00-1:00</span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>

          <span class="aur-delete-demo__time">1:00-2:00</span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
          <span class="aur-delete-demo__cell"></span>
        </div>

        <p class="aur-delete-demo__caption" data-delete-caption>Preview: only the Wednesday event is removed. Monday and Tuesday stay, and the future sessions stay.</p>
      </div>
    media:
      - src: assets/images/using-calendar-events/create-calendar-event.webm
        alt: Using the Delete Series option to remove an event
  - title: Understanding the Coloured Square
    body: |
      Each calendar event includes a small square in the title. This will automatically update based on the wrap up, or if the session is called. This shows the session's current status.

      **Key:**

      - 🆕 **Draft** — A placeholder for a Parent/Carer meeting added by the assigning team.
      - ⬜ **Scheduled** — A future session that is confirmed but has not yet taken place.
      - ✅ **Completed** — A successful session where the mentee attended and the wrap-up is finished.
      - ❌ **Cancelled** — A session cancelled within the official policy. No charge to the parent/carer.
      - 🆘 **Admin Required** — A wrapped-up session that is missing funding contact details. The MindJam Finance Team will sort this for you.
      - 🟧 **Late Notice Cancellation** — A cancellation outside the official policy. The parent/carer will be charged.
      - 🟨 **Did Not Attend** — The mentee did not show up for the session. The parent/carer will be charged.
video:
  src: https://www.youtube-nocookie.com/embed/FilILtVmi7Q?rel=0
  title: Using Calendar Events video
---
