import dotenv from "dotenv";
import fs from "fs";
import PDFDocument from "pdfkit";
import ollama from "ollama";

dotenv.config();

const prompt = `
You are a data insights assistant for a nonprofit car sharing service called MioCar.
You analyze booking logs in a compressed format. Each line represents a booking:
[Status Initial] Station | Booking Creation time, Pickup time → Dropoff time | Vehicle Make Model | Plate | Total Revenue | Trip Distance

Legend:
- "C" = Cancelled, "F" = Finished
- Times are in MM/DD HH:MM format
- Trip Distance is in miles
- Canceled bookings reflect a charge of $0

Your goal is to extract insights useful for MioCar admins, including but not limited to:
- Spikes or drops in activity at specific stations
- Gaps in usage or inconsistent booking patterns
- Interesting revenue insights throughout the period of time

Ignore unimportant trivia. Focus only on patterns relevant to MioCar staff overseeing fleet usage and customer behavior and outlook.

Your output should begin with a brief, business-focused paragraph summary of key findings. Follow this with actionable bullet points for any items that require attention, optimization, or further investigation.

`;

async function generateReport() {
  try {
    const logData = fs.readFileSync("./jsonBookings/inputText.txt", "utf-8");
    const response = await ollama.chat({
      model: "gemma3:4b", 
      messages: [
        {
          role: "user",
          content:`${prompt.trim()}\n\nBooking Logs:\n${logData}`,
        },
      ],
    });

    const reportText =  response.message.content;
    ;
    console.log("AI-Generated Report:\n");
    console.log(reportText);

    // Generate PDF
    const doc = new PDFDocument();
    const outputPath = "./jsonBookings/booking-report.pdf";
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(16).text("Car Booking Report", { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(reportText, {
      align: "left",
    });

    doc.end();

    stream.on("finish", () => {
      console.log("Report saved to:", outputPath);
    });
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
}

generateReport();
