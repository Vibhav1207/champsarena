const fs = require("fs");
const path = require("path");

const files = [
  "src/app/tournaments/[id]/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/players/[username]/page.tsx",
  "src/app/games/[slug]/tournaments/page.tsx",
  "src/app/games/[slug]/page.tsx",
  "src/app/games/[slug]/leaderboards/page.tsx",
  "src/app/games/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx"
];

files.forEach(file => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes("alternatives:")) {
      content = content.replace("alternatives:", "alternates:");
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Fixed: ${file}`);
    } else {
      console.log(`Already fixed or no alternatives in: ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
