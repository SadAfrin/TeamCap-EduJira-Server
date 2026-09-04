import nodemailer from "nodemailer";

// Configure Nodemailer transporter (using Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email notification when leave request status changes
 */
export async function sendLeaveStatusEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  status: "teacher_approved" | "teacher_rejected" | "admin_approved" | "admin_rejected",
  teacherOrAdminName: string,
  comments?: string
): Promise<void> {
  const statusDisplay = status.includes("approved") ? "Approved ✓" : "Rejected ✗";
  const reviewer = status.includes("teacher") ? "Teacher" : "Administrator";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Leave Request ${statusDisplay}</h2>
      <p>Dear ${parentName},</p>
      <p>Your leave request for <strong>${studentName}</strong> has been <strong>${statusDisplay.toLowerCase()}</strong> by the ${reviewer}.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Reviewer:</strong> ${teacherOrAdminName}</p>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ""}
      </div>

      <p>Please log into your EduJira portal to view more details.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated email from EduJira. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EduJira Admin" <${process.env.EMAIL_USER}>`,
      to: parentEmail,
      subject: `Leave Request ${statusDisplay} - ${studentName}`,
      html,
    });
    console.log(`Leave status email sent to ${parentEmail}`);
  } catch (error) {
    console.error("Failed to send leave status email:", error);
    throw error;
  }
}

/**
 * Send email notification when a new message is received
 */
export async function sendNewMessageEmail(
  recipientEmail: string,
  senderName: string,
  messagePreview: string,
  conversationUrl: string
): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">New Message from ${senderName}</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>${senderName}</strong> sent you a message:</p>
        <p style="font-style: italic; color: #666;">
          "${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? "..." : ""}"
        </p>
      </div>

      <p>
        <a href="${conversationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Message
        </a>
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated email from EduJira. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EduJira" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New Message from ${senderName}`,
      html,
    });
    console.log(`New message email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send new message email:", error);
    throw error;
  }
}

/**
 * Send email notification to teachers/admins when a new leave request is submitted
 */
export async function sendLeaveSubmittedEmail(
  teacherOrAdminEmail: string,
  studentName: string,
  parentName: string,
  reason: string,
  startDate: string,
  endDate: string,
  reviewUrl: string
): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">New Leave Request to Review</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Parent:</strong> ${parentName}</p>
        <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>

      <p>
        <a href="${reviewUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Review Request
        </a>
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated email from EduJira. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EduJira Admin" <${process.env.EMAIL_USER}>`,
      to: teacherOrAdminEmail,
      subject: `Leave Request Review Required - ${studentName}`,
      html,
    });
    console.log(`Leave request email sent to ${teacherOrAdminEmail}`);
  } catch (error) {
    console.error("Failed to send leave request email:", error);
    throw error;
  }
}
