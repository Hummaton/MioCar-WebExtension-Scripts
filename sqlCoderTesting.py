import requests
import sqlite3


OLLAMA_URL = "http://localhost:11434/api/generate"
DB_FILE = "test.db"



def setup_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.executescript("""
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS salespeople;
    DROP TABLE IF EXISTS sales;
    DROP TABLE IF EXISTS product_suppliers;

    CREATE TABLE products (
      product_id INTEGER PRIMARY KEY,
      name VARCHAR(50),
      price DECIMAL(10,2),
      quantity INTEGER
    );

    CREATE TABLE customers (
      customer_id INTEGER PRIMARY KEY,
      name VARCHAR(50),
      address VARCHAR(100)
    );

    CREATE TABLE salespeople (
      salesperson_id INTEGER PRIMARY KEY,
      name VARCHAR(50),
      region VARCHAR(50)
    );

    CREATE TABLE sales (
      sale_id INTEGER PRIMARY KEY,
      product_id INTEGER,
      customer_id INTEGER,
      salesperson_id INTEGER,
      sale_date DATE,
      quantity INTEGER
    );

    CREATE TABLE product_suppliers (
      supplier_id INTEGER PRIMARY KEY,
      product_id INTEGER,
      supply_price DECIMAL(10,2)
    );
    """)

    # Some sample dataa
    cursor.execute("INSERT INTO customers (customer_id, name, address) VALUES (1, 'Alice', '123 Street'), (2, 'Bob', '456 Avenue');")
    cursor.execute("INSERT INTO products (product_id, name, price, quantity) VALUES (1, 'Laptop', 1500.00, 10), (2, 'Phone', 800.00, 20);")
    cursor.execute("INSERT INTO salespeople (salesperson_id, name, region) VALUES (1, 'Sam', 'West');")
    cursor.execute("INSERT INTO sales (sale_id, product_id, customer_id, salesperson_id, sale_date, quantity) VALUES (1, 1, 1, 1, '2024-01-01', 1);")
    cursor.execute("INSERT INTO product_suppliers (supplier_id, product_id, supply_price) VALUES (1, 1, 1200.00);")

    conn.commit()
    conn.close()

# I put the prompt from the documentation here  
def build_prompt(user_question):
    return f"""
### Instructions:
Your task is to convert a question into a SQL query, given a SQLite database schema.
Adhere to these rules:
- Deliberately go through the question and database schema word by word to appropriately answer the question.
- Use Table Aliases to prevent ambiguity.
- When creating a ratio, always cast the numerator as float.

### Input:
Generate a SQL query that answers the question: "{user_question}"

This query will run on a database whose schema is represented in this string:

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  price DECIMAL(10,2),
  quantity INTEGER
);

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  address VARCHAR(100)
);

CREATE TABLE salespeople (
  salesperson_id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  region VARCHAR(50)
);

CREATE TABLE sales (
  sale_id INTEGER PRIMARY KEY,
  product_id INTEGER,
  customer_id INTEGER,
  salesperson_id INTEGER,
  sale_date DATE,
  quantity INTEGER
);

CREATE TABLE product_suppliers (
  supplier_id INTEGER PRIMARY KEY,
  product_id INTEGER,
  supply_price DECIMAL(10,2)
);

-- sales.product_id can be joined with products.product_id
-- sales.customer_id can be joined with customers.customer_id
-- sales.salesperson_id can be joined with salespeople.salesperson_id
-- product_suppliers.product_id can be joined with products.product_id

### Response:
Based on your instructions, here is the SQL query I have generated to answer the question "{user_question}":

```sql
"""


# Ask SQLCoder model through Ollama
def ask_sqlcoder(question):
    payload = {
        "model": "sqlcoder:latest",
        "prompt": build_prompt(question),
        "options": {
            "temperature": 0.2,
            "num_ctx": 4096
        },
        "stream": False
    }
    response = requests.post(OLLAMA_URL, json=payload)
    response.raise_for_status()
    result = response.json()
    return result["response"]

def clean_sql_output(raw_output):

    cleaned = raw_output.replace("```sql", "").replace("```", "").replace("<s>", "").strip()

    select_index = cleaned.lower().find("select")
    if select_index != -1:
        cleaned = cleaned[select_index:]
    return cleaned


def execute_sql(query):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        print("\nQuery Results:\n")
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error executing SQL: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    setup_database()
    print("Database setup complete.\n")
    user_question = input("Ask your database a question: ")
    generated_sql = ask_sqlcoder(user_question)
    print("\nGenerated SQL Query:\n")
    print(generated_sql)

    # clean SQL output
    cleaned_sql = clean_sql_output(generated_sql)

    print("\nRunning query against database...")
    execute_sql(cleaned_sql)
