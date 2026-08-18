/// <reference path="../pb_data/types.d.ts" />

// Notifications are created by the browser, so any authenticated user can address one to
// any other user. That is acceptable for a small platform, but the two fields that make a
// forged notification dangerous are constrained here:
//
//   read  - a sender could otherwise deliver a notification pre-marked as read, hiding it
//   link  - an off-site link turns a notification into a credential-phishing vector, since
//           it renders inside the platform with the platform's own styling
//
// Rate limiting for notification spam is still outstanding; see the launch readiness audit.

onRecordCreate((e) => {
  // The recipient decides what they have read, not the sender.
  e.record.set('read', false);

  const link = e.record.getString('link');
  if (link && !/^\/[^/\\]/.test(link)) {
    throw new BadRequestError('Notification links must be relative paths within the site.');
  }

  e.next();
}, 'notifications');
