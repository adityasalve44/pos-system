/**
 * Phase 2: Local Printer Bridge Agent
 * 
 * Runs on a local device (Raspberry Pi / old phone) connected to
 * the same WiFi network as the thermal printer.
 * 
 * Setup:
 *   npm install express node-thermal-printer
 *   PRINTER_IP=192.168.1.xxx node bridge/server.js
 */
const express = require("express");
const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.100";
const API_SECRET = process.env.API_SECRET || "bridge-secret-change-me";

app.use((req, res, next) => {
  const auth = req.headers["x-bridge-secret"];
  if (auth !== API_SECRET) return res.status(401).json({ error: "Unauthorized" });
  next();
});

app.post("/print", async (req, res) => {
  const payload = req.body;

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:9100`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });

  try {
    printer.alignCenter();
    printer.bold(true);
    printer.println(payload.restaurantName);
    printer.bold(false);
    if (payload.restaurantAddress) printer.println(payload.restaurantAddress);
    if (payload.restaurantPhone) printer.println(`Tel: ${payload.restaurantPhone}`);
    if (payload.gstNumber) printer.println(`GSTIN: ${payload.gstNumber}`);

    printer.drawLine();
    printer.alignLeft();
    printer.println(`Receipt: ${payload.receiptNumber}`);
    printer.println(`Date: ${payload.billedAt}`);
    if (payload.tableName) printer.println(`Table: ${payload.tableName}`);
    if (payload.customerName) printer.println(`Customer: ${payload.customerName}`);
    printer.println(`Type: ${payload.orderType === "dine_in" ? "Dine In" : "Takeout"}`);
    printer.drawLine();

    // Items
    for (const item of payload.items) {
      const left = `${item.name} x${item.quantity}`;
      const right = `Rs.${parseFloat(item.lineTotal).toFixed(2)}`;
      printer.leftRight(left, right);
    }

    printer.drawLine();
    printer.leftRight("Subtotal", `Rs.${parseFloat(payload.subtotal).toFixed(2)}`);
    printer.leftRight(`GST (${payload.taxRate}%)`, `Rs.${parseFloat(payload.taxAmount).toFixed(2)}`);
    printer.bold(true);
    printer.leftRight("TOTAL", `Rs.${parseFloat(payload.totalAmount).toFixed(2)}`);
    printer.bold(false);

    if (payload.paymentMethod) {
      printer.println(`Payment: ${payload.paymentMethod.toUpperCase()}`);
    }

    printer.drawLine();
    printer.alignCenter();
    printer.println("Thank you for dining with us!");
    printer.println("Please visit again");
    printer.cut();

    await printer.execute();
    res.json({ success: true });
  } catch (err) {
    console.error("Print error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", printer: PRINTER_IP }));

app.listen(PORT, () => {
  console.log(`🖨️  Printer bridge running on port ${PORT}`);
  console.log(`   Printer IP: ${PRINTER_IP}`);
});
