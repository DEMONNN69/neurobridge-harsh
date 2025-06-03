import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_core.output_parsers import StrOutputParser
from pprint import pprint  # For debugging, if needed

def generate_assessment_questions(
    condition: str,
    num_easy: int,
    num_moderate: int,
    num_hard: int,
    google_api_key: str = None
) -> dict:
    """
    Generates assessment questions for a given condition (dyslexia or autism)
    using the Gemini model via Langchain, with a specific JSON output format.

    Args:
        condition (str): The learning condition, e.g., "dyslexia" or "autism".
        num_easy (int): Number of easy questions to generate.
        num_moderate (int): Number of moderate questions to generate.
        num_hard (int): Number of hard questions to generate.
        google_api_key (str, optional): Google API key. If None, it tries to read from
                                       the GOOGLE_API_KEY environment variable.

    Returns:
        dict: A dictionary containing the generated questions in the specified JSON structure,
              or an error message if generation fails.
    """
    # API Key Handling: Prioritize passed key, then environment variable.
    if google_api_key:
        os.environ["GOOGLE_API_KEY"] = google_api_key
    elif not os.getenv("GOOGLE_API_KEY"):
        return {
            "error": "GOOGLE_API_KEY not found. Please set it as an environment variable or pass it as an argument."
        }

    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
    except Exception as e:
        return {
            "error": f"Failed to initialize Gemini model: {str(e)}"
        }

    total_questions = num_easy + num_moderate + num_hard

    prompt_template_str = """
    You are an AI assistant specialized in creating educational assessment tools.
    Your primary task is to generate a set of Multiple Choice Questions (MCQs) tailored for students with {condition}.
    The questions should cover different difficulty levels: {num_easy} easy, {num_moderate} moderate, and {num_hard} hard.
    Each question must have 4 distinct options, and you must clearly indicate the correct answer.

    Output the questions in a single, valid JSON object. Do not include any explanatory text before or after the JSON object.
    The JSON object MUST have a top-level key "condition" (set to the value of {condition}) and a key "questions".
    The "questions" key should map to a JSON ARRAY where each element is an object containing the question details.

    Each question object MUST have the following fields:
    - "id": A numeric ID for the question (starting from 1).
    - "difficulty": A string indicating the difficulty level ("easy", "moderate", or "hard").
    - "question": The text of the question. This should be clear and unambiguous for the target group.
    - "options": A list of 4 strings representing the choices. Ensure options are plausible but only one is correct.
    - "correct_answer": A string that exactly matches one of the provided options.
    - "explanation": A brief explanation of why the answer is correct (optional but recommended).

    Here are some examples of the required JSON structure:

    If the condition is "dyslexia":
    Focus on phonological awareness, word recognition, visual discrimination of letters/words, and simple comprehension. Avoid visually cluttered text in questions.
    Example Output Structure:
    {{
      "condition": "dyslexia",
      "questions": [
        {{
          "id": 1,
          "difficulty": "easy",
          "question": "Which word rhymes with 'sun'?",
          "options": ["run", "sit", "map", "hen"],
          "correct_answer": "run",
          "explanation": "Both 'sun' and 'run' end with the same 'un' sound."
        }},
        {{
          "id": 2,
          "difficulty": "moderate",
          "question": "Which of these words is spelled correctly?",
          "options": ["trane", "train", "tran", "trayn"],
          "correct_answer": "train",
          "explanation": "The correct spelling uses 'ai' to make the long 'a' sound."
        }},
        {{
          "id": 3,
          "difficulty": "hard",
          "question": "Read the sentence: 'The quick brown fox jumps over the lazy dog.' What is the fox doing?",
          "options": ["Sleeping", "Eating", "Jumping", "Sitting"],
          "correct_answer": "Jumping",
          "explanation": "The sentence states that the fox 'jumps over' the dog."
        }}
      ]
    }}    If the condition is "autism":
    Focus on social understanding, literal comprehension, identifying emotions, and understanding simple social cues. Questions should be direct and clear.
    Example Output Structure:
    {{
      "condition": "autism",
      "questions": [
        {{
          "id": 1,
          "difficulty": "easy",
          "question": "If someone is smiling and laughing, they are probably feeling:",
          "options": ["Sad", "Happy", "Angry", "Tired"],
          "correct_answer": "Happy",
          "explanation": "Smiling and laughing are signs that someone feels happy or joyful."
        }},
        {{
          "id": 2,
          "difficulty": "moderate",
          "question": "Tom is building a tower with blocks. His friend Sam accidentally knocks it over. Tom starts to cry. Why is Tom crying?",
          "options": ["He is happy Sam is there.", "He is tired of playing.", "His tower fell down.", "He wants a new toy."],
          "correct_answer": "His tower fell down.",
          "explanation": "Tom is upset because something he worked on was destroyed."
        }}
      ]
    }}    If the condition is "mixed":
    Generate exactly half the questions focused on dyslexia and half focused on autism. For {total_questions} total questions, generate {half_dyslexia} dyslexia questions and {half_autism} autism questions. Mix them randomly. For dyslexia questions, focus on phonological awareness, word recognition, and comprehension. For autism questions, focus on social understanding and emotional recognition.
    Example Output Structure:
    {{
      "condition": "mixed",
      "questions": [
        {{
          "id": 1,
          "difficulty": "easy",
          "question": "Which word rhymes with 'cat'?",
          "options": ["dog", "bat", "car", "sun"],
          "correct_answer": "bat",
          "explanation": "Both 'cat' and 'bat' end with the same 'at' sound.",
          "focus_area": "dyslexia"
        }},
        {{
          "id": 2,
          "difficulty": "easy", 
          "question": "If someone has tears on their face, they are probably:",
          "options": ["Happy", "Sad", "Hungry", "Sleepy"],
          "correct_answer": "Sad",
          "explanation": "Tears usually indicate sadness or being upset.",
          "focus_area": "autism"
        }}
      ]
    }}

    Please generate a total of {total_questions} questions: {num_easy} easy, {num_moderate} moderate, and {num_hard} hard for the condition: {condition}.
    If condition is "mixed", ensure exactly half the questions target dyslexia-related skills and half target autism-related skills. For {total_questions} total questions, this means {half_dyslexia} dyslexia questions and {half_autism} autism questions.
    The question IDs should be sequential numbers starting from 1.
    Ensure the entire output is ONLY the JSON object, starting with {{ and ending with }}.
    """

    prompt = PromptTemplate(
        template=prompt_template_str,
        input_variables=["condition", "num_easy", "num_moderate", "num_hard", "total_questions", "half_dyslexia", "half_autism"]
    )

    chain = LLMChain(llm=llm, prompt=prompt, output_parser=StrOutputParser())

    # Calculate half values for mixed condition
    half_dyslexia = total_questions // 2
    half_autism = total_questions - half_dyslexia  # Handle odd numbers

    try:
        response = chain.invoke({
            "condition": condition,
            "num_easy": num_easy,
            "num_moderate": num_moderate,
            "num_hard": num_hard,
            "total_questions": total_questions,
            "half_dyslexia": half_dyslexia,
            "half_autism": half_autism
        })
        
        # Get the response text
        response_str = response["text"]
        cleaned_response_str = response_str.strip()
        
        # Clean up potential markdown code block formatting
        if cleaned_response_str.startswith("```json"):
            cleaned_response_str = cleaned_response_str[7:]
        if cleaned_response_str.startswith("```"):
            cleaned_response_str = cleaned_response_str[3:]
        if cleaned_response_str.endswith("```"):
            cleaned_response_str = cleaned_response_str[:-3]
        
        cleaned_response_str = cleaned_response_str.strip()

        # Parse the JSON response
        generated_questions = json.loads(cleaned_response_str)
        
        # Validate the response structure
        if "questions" not in generated_questions:
            return {
                "error": "Invalid response format: missing 'questions' key",
                "raw_output": response_str
            }
        
        if "condition" not in generated_questions:
            generated_questions["condition"] = condition
            
        return generated_questions
        
    except json.JSONDecodeError as e:
        error_message = f"Failed to parse JSON response from LLM: {e}"
        print(f"{error_message}\nLLM Output was:\n{response_str}")
        return {"error": error_message, "raw_output": response_str}
    except Exception as e:
        error_message = f"An unexpected error occurred: {e}"
        # Ensure response_str is defined for the error message
        raw_output_for_error = response_str if 'response_str' in locals() else 'N/A'
        print(f"{error_message}\nLLM Output was:\n{raw_output_for_error}")
        return {"error": error_message, "raw_output": raw_output_for_error}


if __name__ == "__main__":
    # Load environment variables for testing
    import os
    from dotenv import load_dotenv
    
    # Load the .env file from the project root
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    
    # Test the function when run directly
    print("Testing question generation...")
    
    # Test for Mixed condition
    print("Generating mixed questions (5 dyslexia + 5 autism)...")
    mixed_questions = generate_assessment_questions(
        condition="mixed",
        num_easy=2,
        num_moderate=4,
        num_hard=4
    )
    
    if "error" in mixed_questions:
        print(f"Error generating mixed questions: {mixed_questions['error']}")
    else:
        print("\nMixed Questions JSON:")
        print(json.dumps(mixed_questions, indent=2, default=str))
        
        # Count dyslexia vs autism questions
        dyslexia_count = 0
        autism_count = 0
        for q in mixed_questions.get("questions", []):
            if q.get("focus_area") == "dyslexia":
                dyslexia_count += 1
            elif q.get("focus_area") == "autism":
                autism_count += 1
        
        print(f"\nQuestion breakdown: {dyslexia_count} dyslexia, {autism_count} autism")
    
    print("-" * 50)
    
    # Test for Dyslexia
    print("Generating questions for Dyslexia...")
    dyslexia_questions = generate_assessment_questions(
        condition="dyslexia",
        num_easy=2,
        num_moderate=1,
        num_hard=1
    )
    
    if "error" in dyslexia_questions:
        print(f"Error generating dyslexia questions: {dyslexia_questions['error']}")
    else:
        print("\nDyslexia Questions JSON:")
        print(json.dumps(dyslexia_questions, indent=2, default=str))
    
    print("-" * 50)
    
    # Test for Autism
    print("\nGenerating questions for Autism...")
    autism_questions = generate_assessment_questions(
        condition="autism",
        num_easy=1,
        num_moderate=1,
        num_hard=1
    )
    
    if "error" in autism_questions:
        print(f"Error generating autism questions: {autism_questions['error']}")
    else:
        print("\nAutism Questions JSON:")
        print(json.dumps(autism_questions, indent=2, default=str))
