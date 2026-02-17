const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const QUESTIONS = [
  // Difficulty 1 (Easy)
  { id: "q-1", difficulty: 1, prompt: "Which planet is known as the Red Planet?", choices: ["Earth", "Mars", "Venus", "Jupiter"], correctIndex: 1, tags: ["space"] },
  { id: "q-2", difficulty: 1, prompt: "What is the largest ocean on Earth?", choices: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2, tags: ["geography"] },
  { id: "q-3", difficulty: 1, prompt: "2 + 2 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, tags: ["math"] },
  { id: "q-4", difficulty: 1, prompt: "How many days are in a week?", choices: ["5", "6", "7", "8"], correctIndex: 2, tags: ["general"] },

  // Difficulty 2
  { id: "q-5", difficulty: 2, prompt: "Which number is a prime?", choices: ["21", "27", "29", "33"], correctIndex: 2, tags: ["math"] },
  { id: "q-6", difficulty: 2, prompt: "Which language runs in a web browser?", choices: ["Python", "C", "JavaScript", "Go"], correctIndex: 2, tags: ["tech"] },
  { id: "q-7", difficulty: 2, prompt: "What is the capital of France?", choices: ["Lyon", "Paris", "Marseille", "Nice"], correctIndex: 1, tags: ["geography"] },
  { id: "q-8", difficulty: 2, prompt: "How many continents are there?", choices: ["5", "6", "7", "8"], correctIndex: 2, tags: ["geography"] },

  // Difficulty 3
  { id: "q-9", difficulty: 3, prompt: "What is the square root of 144?", choices: ["10", "11", "12", "14"], correctIndex: 2, tags: ["math"] },
  { id: "q-10", difficulty: 3, prompt: "Which element has the chemical symbol O?", choices: ["Gold", "Oxygen", "Osmium", "Zinc"], correctIndex: 1, tags: ["science"] },
  { id: "q-11", difficulty: 3, prompt: "What is 15% of 200?", choices: ["20", "25", "30", "35"], correctIndex: 2, tags: ["math"] },
  { id: "q-12", difficulty: 3, prompt: "Who was the first US President?", choices: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], correctIndex: 1, tags: ["history"] },

  // Difficulty 4
  { id: "q-13", difficulty: 4, prompt: "Which year did the first iPhone launch?", choices: ["2005", "2007", "2009", "2011"], correctIndex: 1, tags: ["tech"] },
  { id: "q-14", difficulty: 4, prompt: "Who wrote 'To Kill a Mockingbird'?", choices: ["Harper Lee", "George Orwell", "Toni Morrison", "J.K. Rowling"], correctIndex: 0, tags: ["literature"] },
  { id: "q-15", difficulty: 4, prompt: "What is the chemical formula for table salt?", choices: ["NaCl", "KCl", "MgCl2", "CaCl2"], correctIndex: 0, tags: ["science"] },
  { id: "q-16", difficulty: 4, prompt: "How many strings does a violin have?", choices: ["3", "4", "5", "6"], correctIndex: 1, tags: ["music"] },

  // Difficulty 5
  { id: "q-17", difficulty: 5, prompt: "Which city hosted the 2012 Summer Olympics?", choices: ["Beijing", "London", "Rio", "Athens"], correctIndex: 1, tags: ["sports"] },
  { id: "q-18", difficulty: 5, prompt: "What is the derivative of x^2?", choices: ["x", "2x", "x^2", "2"], correctIndex: 1, tags: ["calculus"] },
  { id: "q-19", difficulty: 5, prompt: "What is the speed of light?", choices: ["300,000 km/s", "150,000 km/s", "600,000 km/s", "100,000 km/s"], correctIndex: 0, tags: ["physics"] },
  { id: "q-20", difficulty: 5, prompt: "Which novel begins with 'Call me Ishmael'?", choices: ["Moby Dick", "Treasure Island", "20,000 Leagues", "Robinson Crusoe"], correctIndex: 0, tags: ["literature"] },

  // Difficulty 6
  { id: "q-21", difficulty: 6, prompt: "Which protocol is used for secure web browsing?", choices: ["HTTP", "SSH", "HTTPS", "FTP"], correctIndex: 2, tags: ["tech"] },
  { id: "q-22", difficulty: 6, prompt: "Which organelle produces ATP in cells?", choices: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], correctIndex: 2, tags: ["science"] },
  { id: "q-23", difficulty: 6, prompt: "What is the atomic number of Carbon?", choices: ["4", "6", "8", "12"], correctIndex: 1, tags: ["chemistry"] },
  { id: "q-24", difficulty: 6, prompt: "Who composed Beethoven's Ninth Symphony?", choices: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Franz Joseph Haydn"], correctIndex: 0, tags: ["music"] },

  // Difficulty 7
  { id: "q-25", difficulty: 7, prompt: "Who painted the ceiling of the Sistine Chapel?", choices: ["Michelangelo", "Da Vinci", "Raphael", "Donatello"], correctIndex: 0, tags: ["art"] },
  { id: "q-26", difficulty: 7, prompt: "Which sorting algorithm has average O(n log n) and is stable?", choices: ["Quick sort", "Heap sort", "Merge sort", "Selection sort"], correctIndex: 2, tags: ["cs"] },
  { id: "q-27", difficulty: 7, prompt: "What is the Heisenberg Uncertainty Principle about?", choices: ["Energy conservation", "Position and momentum", "Wave-particle duality", "Quantum entanglement"], correctIndex: 1, tags: ["physics"] },
  { id: "q-28", difficulty: 7, prompt: "Who wrote 'One Hundred Years of Solitude'?", choices: ["Jorge Luis Borges", "Gabriel García Márquez", "Pablo Neruda", "Octavio Paz"], correctIndex: 1, tags: ["literature"] },

  // Difficulty 8
  { id: "q-29", difficulty: 8, prompt: "Which country has the highest coffee consumption per capita?", choices: ["Brazil", "Finland", "Canada", "Italy"], correctIndex: 1, tags: ["culture"] },
  { id: "q-30", difficulty: 8, prompt: "What is the smallest prime greater than 100?", choices: ["101", "103", "107", "109"], correctIndex: 0, tags: ["math"] },
  { id: "q-31", difficulty: 8, prompt: "Which enzyme breaks down lactose?", choices: ["Amylase", "Lipase", "Lactase", "Protease"], correctIndex: 2, tags: ["biology"] },
  { id: "q-32", difficulty: 8, prompt: "What does the Lorentz transformation describe?", choices: ["Gravity", "Electromagnetic fields", "Spacetime intervals", "Quantum tunneling"], correctIndex: 2, tags: ["physics"] },

  // Difficulty 9
  { id: "q-33", difficulty: 9, prompt: "Which data structure is best for LRU cache eviction?", choices: ["Stack", "Queue", "Hash map + doubly linked list", "Binary tree"], correctIndex: 2, tags: ["cs"] },
  { id: "q-34", difficulty: 9, prompt: "What is the integral of 1/x dx?", choices: ["x", "ln|x| + C", "1/x", "x^2/2"], correctIndex: 1, tags: ["calculus"] },
  { id: "q-35", difficulty: 9, prompt: "What is Gödel's Incompleteness Theorem about?", choices: ["Mathematical logic limits", "Quantum mechanics", "Group theory", "Number theory"], correctIndex: 0, tags: ["math"] },
  { id: "q-36", difficulty: 9, prompt: "Which composer wrote 'The Rite of Spring'?", choices: ["Igor Stravinsky", "Sergei Prokofiev", "Dmitri Shostakovich", "Pyotr Ilyich Tchaikovsky"], correctIndex: 0, tags: ["music"] },

  // Difficulty 10 (Hardest)
  { id: "q-37", difficulty: 10, prompt: "Which algorithm solves shortest path with negative weights?", choices: ["Dijkstra", "Bellman-Ford", "A*", "Prim"], correctIndex: 1, tags: ["cs"] },
  { id: "q-38", difficulty: 10, prompt: "Which theorem underpins RSA encryption?", choices: ["Fermat's little theorem", "Euclid's lemma", "Chinese remainder theorem", "Euler's theorem"], correctIndex: 3, tags: ["crypto"] },
  { id: "q-39", difficulty: 10, prompt: "What is the fundamental theorem of galois theory?", choices: ["About polynomial roots", "Field extensions and groups", "Quantum symmetries", "Algebraic integers"], correctIndex: 1, tags: ["math"] },
  { id: "q-40", difficulty: 10, prompt: "Who proved Fermat's Last Theorem?", choices: ["Andrew Wiles", "Pierre de Fermat", "Leonhard Euler", "Carl Friedrich Gauss"], correctIndex: 0, tags: ["math"] },
];

async function seed() {
  // Validate environment
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = await pool.connect();
  
  try {
    console.log('Starting database seed...');
    
    // Clear existing questions
    await client.query('DELETE FROM questions');
    console.log('Cleared existing questions');
    
    // Insert questions
    for (const q of QUESTIONS) {
      await client.query(
        `INSERT INTO questions (id, difficulty, prompt, choices, correct_answer_hash, tags) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          q.id,
          q.difficulty,
          q.prompt,
          JSON.stringify(q.choices),
          `hash-${q.id}`, // Placeholder hash
          q.tags,
        ]
      );
    }
    
    console.log(`✓ Seeded ${QUESTIONS.length} questions`);
    
    // Verify
    const result = await client.query('SELECT COUNT(*) as count FROM questions');
    console.log(`✓ Database now has ${result.rows[0].count} questions`);
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Top-level seed error:', error);
  process.exit(1);
});
