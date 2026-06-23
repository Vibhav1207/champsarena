import * as crypto from "crypto";

const SALT = process.env.AUTH_SECRET || "champs-captcha-secret-salt-123456";

export interface CaptchaChallenge {
  question: string;
  token: string;
}

export function generateCaptcha(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const operations = ["+", "-"];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let answer = 0;
  let opSymbol = "";
  switch (operation) {
    case "+":
      answer = num1 + num2;
      opSymbol = "+";
      break;
    case "-":
      answer = Math.max(num1, num2) - Math.min(num1, num2); // Avoid negative answers for simplicity
      opSymbol = "-";
      break;
  }
  
  const operand1 = operation === "-" ? Math.max(num1, num2) : num1;
  const operand2 = operation === "-" ? Math.min(num1, num2) : num2;
  const question = `SOLVE: ${operand1} ${opSymbol} ${operand2} = ?`;
  const expires = Date.now() + 1000 * 60 * 5; // 5 minutes validity
  
  // Create token: hash(answer + salt + expires) + "." + expires
  const data = `${answer}:${expires}`;
  const hash = crypto.createHmac("sha256", SALT).update(data).digest("hex");
  const token = `${hash}.${expires}`;
  
  return { question, token };
}

export function verifyCaptcha(answer: string, token: string): boolean {
  if (!answer || !token) return false;
  try {
    const [hash, expiresStr] = token.split(".");
    const expires = parseInt(expiresStr);
    
    if (Date.now() > expires) {
      return false; // Expired CAPTCHA
    }
    
    const cleanAnswer = parseInt(answer.trim());
    if (isNaN(cleanAnswer)) return false;
    
    const data = `${cleanAnswer}:${expires}`;
    const expectedHash = crypto.createHmac("sha256", SALT).update(data).digest("hex");
    
    // Constant time comparison to prevent timing side channels
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}
