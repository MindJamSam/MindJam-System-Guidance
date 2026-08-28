---
title: Terminology
section: resources
description: A plain-English guide to common Salesforce terms used across the Community Site and this training guide.
accordion_toolbar: true
---

<div class="aur-term-accordion aur-term-accordion--terminology" data-aur-accordion>

<details class="aur-term-section aur-tile" open>
  <summary class="aur-term-section__summary">
    <span>
      <span class="aur-term-section__title">General Salesforce Terms</span>
      <span class="aur-term-section__hint">Common words you will see across Salesforce.</span>
    </span>
    <span class="aur-term-section__chevron" aria-hidden="true"></span>
  </summary>
  <div class="aur-term-section__body">
    <dl class="aur-glossary aur-glossary--term-cards">
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Flow</dt>
        <dd class="aur-glossary__def">A flow is a guided step-by-step process built into Salesforce. When you are asked to follow a flow, the system will walk you through each step one at a time. For example, the <strong>Update Games and Equipment</strong> process is a flow.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Service Appointment</dt>
        <dd class="aur-glossary__def">A service appointment is what Salesforce calls a scheduled mentoring session. Each session you run with a mentee has a corresponding service appointment record. This is where you will find the session details and where you go to wrap up the session afterwards.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Event</dt>
        <dd class="aur-glossary__def">An event is a calendar entry in Salesforce. It represents a scheduled date and time for a session. Events appear in your calendar view and are linked to the related service appointment.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Profile</dt>
        <dd class="aur-glossary__def">Your profile is your personal account area on the Community Site. It contains your details such as your name, contact information, and profile picture. You can update it from the <strong>Profile</strong> or <strong>My Account</strong> section.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Dashboard</dt>
        <dd class="aur-glossary__def">The dashboard is a visual summary page that shows useful information at a glance. It can include things like how many sessions you have this week, how much you have earned in a month, and other key figures. Dashboards can be customised by senior leadership if you need different information displayed.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">Report</dt>
        <dd class="aur-glossary__def">A report is a list or summary of data pulled from Salesforce. For example, a report might show all sessions for a particular month or all mentees assigned to you. Reports are mostly used by senior leadership, but you may occasionally see references to them.</dd>
      </div>
      <div class="aur-glossary__entry">
        <dt class="aur-glossary__term">List View</dt>
        <dd class="aur-glossary__def">
          <p>A <strong>list view</strong> in Salesforce is a filtered table of records. It lets you choose which records appear and which columns you can see. For example, a mentor could use a list view to see only the mentees assigned to them.</p>
          <p class="aur-glossary__note"><strong>Important:</strong> By default, your list views may open as <strong>Recently Viewed</strong>. To change this, click the small downward triangle next to the list view name, choose the list view you want, then click the <strong>pin icon</strong>. This pins the view so it opens automatically next time.</p>
        </dd>
      </div>
    </dl>
  </div>
</details>

<details class="aur-term-section aur-tile">
  <summary class="aur-term-section__summary">
    <span>
      <span class="aur-term-section__title">Session Statuses</span>
      <span class="aur-term-section__hint">What each session status means.</span>
    </span>
    <span class="aur-term-section__chevron" aria-hidden="true"></span>
  </summary>
  <div class="aur-term-section__body">
    <p class="aur-info-card__prose">Each session has a status that describes what happened. Calendar events may also show a small coloured indicator based on the status.</p>
    <table class="aur-status-table">
      <thead>
        <tr>
          <th class="aur-status-table__emoji">Indicator</th>
          <th class="aur-status-table__name">Status</th>
          <th class="aur-status-table__desc">What it means</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="aur-status-table__emoji">🆕</td>
          <td class="aur-status-table__name">Draft</td>
          <td class="aur-status-table__desc">A placeholder for a parent/carer meeting added by the assigning team. This is not a confirmed session yet. This status will only appear for new mentees on your caseload.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">⬜</td>
          <td class="aur-status-table__name">Scheduled</td>
          <td class="aur-status-table__desc">A future session that is confirmed but has not yet taken place. This is the default state for upcoming sessions.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">✅</td>
          <td class="aur-status-table__name">Completed (Attended)</td>
          <td class="aur-status-table__desc">The session took place as planned. Both you and the mentee were present, and the wrap-up is finished.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">🟨</td>
          <td class="aur-status-table__name">Did Not Attend</td>
          <td class="aur-status-table__desc">The mentee did not show up for the session. You were available and ready, but the session did not go ahead. The parent or carer will be charged.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">🟧</td>
          <td class="aur-status-table__name">Late Notice Cancellation</td>
          <td class="aur-status-table__desc">The session was cancelled outside the official cancellation policy window. Because it was cancelled too late, the parent or carer will still be charged. You should still wrap the session up with this status so it is recorded properly.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">❌</td>
          <td class="aur-status-table__name">Cancelled</td>
          <td class="aur-status-table__desc">The session was cancelled within the official cancellation policy. Because enough notice was given, the parent or carer will not be charged.</td>
        </tr>
        <tr>
          <td class="aur-status-table__emoji">🆘</td>
          <td class="aur-status-table__name">Admin Required</td>
          <td class="aur-status-table__desc">A wrapped-up session that is missing funding contact details. The MindJam Finance Team will sort this for you. No action is needed from your side.</td>
        </tr>
      </tbody>
    </table>
  </div>
</details>

<details class="aur-term-section aur-tile">
  <summary class="aur-term-section__summary">
    <span>
      <span class="aur-term-section__title">Event Types</span>
      <span class="aur-term-section__hint">Which calendar event type to choose.</span>
    </span>
    <span class="aur-term-section__chevron" aria-hidden="true"></span>
  </summary>
  <div class="aur-term-section__body aur-prose">
    <p>When you create a calendar event, you choose a type. Here is what the main types mean:</p>

    <div class="aur-term-card-grid">
      <section class="aur-term-card">
        <h3>Mentoring and Other Paid Work</h3>
        <ul>
          <li><strong>MindJam Mentoring</strong>: normal mentoring sessions, paid at your hourly rate.</li>
          <li><strong>Other Paid Work</strong>: work that is not mentoring but is still paid at your hourly rate.</li>
        </ul>
      </section>

      <section class="aur-term-card">
        <h3>Group Sessions</h3>
        <ul>
          <li><strong>Adventure Guild</strong>: D&amp;D (Dungeons &amp; Dragons) sessions.</li>
          <li><strong>Group Session</strong>: standard group sessions.</li>
        </ul>
      </section>

      <section class="aur-term-card">
        <h3>Fixed Rate Meetings (GBP 40)</h3>
        <ul>
          <li><strong>Meeting (Charged)</strong>: formal meetings you can charge for.</li>
          <li><strong>Official Meeting</strong>: meetings that can be charged.</li>
          <li><strong>Report (Charged)</strong>: formal reports that you can charge for.</li>
        </ul>
      </section>

      <section class="aur-term-card">
        <h3>Non-Chargeable / Internal</h3>
        <ul>
          <li><strong>Report</strong>: reports that are not charged.</li>
          <li><strong>Parent/Carer Meeting</strong>: initial meetings with parents or carers, not charged.</li>
          <li><strong>Personal Time</strong>: used for blockers or reminders, not billed.</li>
        </ul>
      </section>

      <section class="aur-term-card aur-term-card--full">
        <h3>Types to Ignore</h3>
        <p>The following types may appear in the list but are not relevant to most mentors:</p>
        <ul>
          <li><strong>BlockJam Counselling</strong></li>
          <li><strong>Counselling</strong></li>
          <li><strong>Training</strong>, which may be removed later</li>
        </ul>
      </section>
    </div>
  </div>
</details>

<details class="aur-term-section aur-tile">
  <summary class="aur-term-section__summary">
    <span>
      <span class="aur-term-section__title">Wrapping Up</span>
      <span class="aur-term-section__hint">What it means to wrap up a session.</span>
    </span>
    <span class="aur-term-section__chevron" aria-hidden="true"></span>
  </summary>
  <div class="aur-term-section__body aur-prose">
    <div class="aur-term-card-grid">
      <section class="aur-term-card">
        <h3>What wrap up means</h3>
        <p><strong>Wrap up</strong> means completing the session record after it has taken place, or after it has been missed or cancelled.</p>
      </section>

      <section class="aur-term-card">
        <h3>What you do</h3>
        <ul>
          <li>Select the session status, such as Attended, Did Not Attend, Late Notice Cancellation, or Cancelled</li>
          <li>Add any session notes</li>
          <li>Confirm the details so the record is finalised</li>
        </ul>
      </section>

      <section class="aur-term-card aur-term-card--full">
        <h3>Why it matters</h3>
        <p>Wrapping up is important because it is used for <strong>attendance tracking</strong>, <strong>invoicing</strong>, and <strong>payment</strong>. Sessions should be wrapped up before the end of each month.</p>
      </section>
    </div>
  </div>
</details>

</div>
