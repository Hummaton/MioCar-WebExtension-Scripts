require("dotenv").config();
const fs = require("fs");
const { OpenAI } = require("openai");
const PDFDocument = require("pdfkit");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

//load the cleaned booking data
const raw = fs.readFileSync("./jsonBookings/cleaned_bookings.json", "utf8");
const jsonData = JSON.parse(raw);
const bookings = jsonData?.response?._embedded?.items || [];

const prompt = `
You are a data analyst. Below is a dataset of car bookings.
Each entry includes:
- status: 1 = Finished, 0 = Cancelled
- createdAt: booking creation time
- pickUpDatetime / dropOffDatetime: trip times
- vehicleMake/Model/Plate
- stationName: location
- totalRevenue: dollars
- type: Personal or Business

Please write a short analysis that includes:
- A general summary
- Interesting trends or repeated patterns
- Unusual or standout events
- Observations about cancellations, revenue, station popularity, etc.

Data:
${JSON.stringify(bookings)}
`;


async function generateReport() {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4
      });
  
      const reportText = response.choices[0].message.content;
      console.log("AI-Generated Report:\n");
      console.log(reportText);
  
      //generate PDF
      const doc = new PDFDocument();
      const outputPath = "./jsonBookings/booking-report.pdf";
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
  
      doc.fontSize(16).text("Car Booking Report", { underline: true });
      doc.moveDown();
  
      doc.fontSize(12).text(reportText, {
        align: "left"
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
