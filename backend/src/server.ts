import app from './app';
import dotenv from 'dotenv';

dotenv.config();
console.log("MONGODB_URI from env:", process.env.MONGODB_URI);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
