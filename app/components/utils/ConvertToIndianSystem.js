export default function convertToIndianNumberSystem(num = 0) {
  if (typeof num !== "number") {
    num = parseFloat(num);
    if (isNaN(num)) {
      return "Invalid Input";
    }
  }

  const inputStr = num.toFixed(2).toString();
  const [numStr, decimal] = inputStr.split(".");

  const formattedDecimal = decimal ? `.${decimal}` : "";
  const len = numStr.length;

  if (len <= 3) {
    return numStr + formattedDecimal;
  }

  const lastThreeDigits = numStr.slice(-3);
  const remainingDigits = numStr.slice(0, len - 3);

  let formattedRemaining = "";
  for (let i = remainingDigits.length - 1; i >= 0; i--) {
    formattedRemaining = remainingDigits[i] + formattedRemaining;
    if ((remainingDigits.length - i) % 2 === 0 && i !== 0) {
      formattedRemaining = "," + formattedRemaining;
    }
  }

  return formattedRemaining + "," + lastThreeDigits + formattedDecimal;
}
