# Setting Up API Keys

This application requires two API keys to function properly:
1. OpenRouter API key - For the Science Quiz Generator
2. Replicate API key - For PDF processing and as an alternative LLM provider

## Setting Up OpenRouter API Key

To get real educational content for the Science Quiz Generator, you need to set up an OpenRouter API key. Here's how:

## Step 1: Create an OpenRouter Account

1. Go to [OpenRouter](https://openrouter.ai/) and sign up for an account
2. You can sign up with Google, GitHub, or email

## Step 2: Get an API Key

1. After signing in, go to [API Keys](https://openrouter.ai/keys)
2. Click "Create Key"
3. Give your key a name (e.g., "Science Quiz Generator")
4. Select the models you want to use (at minimum, select "GPT-3.5 Turbo")
5. Click "Create"
6. Copy the API key that is generated

## Step 3: Update Your .env.local File

1. Open the `.env.local` file in the root of the project
2. Replace the existing API key with your new API key:

```
# OpenRouter API Key
OPENROUTER_API_KEY=your_new_api_key_here

# Replicate API Key
REPLICATE_API_KEY=your_replicate_api_key_here
```

3. Save the file

## Step 4: Restart the Development Server

1. Stop the current development server (if running) by pressing `Ctrl+C` in the terminal
2. Start the server again with `npm run dev`

## Setting Up Replicate API Key

To process PDFs and use Replicate as an alternative LLM provider, you need to set up a Replicate API key. Here's how:

## Step 1: Create a Replicate Account

1. Go to [Replicate](https://replicate.com/) and sign up for an account
2. You can sign up with GitHub, Google, or email

## Step 2: Get an API Key

1. After signing in, go to [API Tokens](https://replicate.com/account/api-tokens)
2. Click "Create token"
3. Give your token a name (e.g., "IB DP Study Helper")
4. Copy the API token that is generated

## Step 3: Update Your .env.local File

1. Open the `.env.local` file in the root of the project
2. Add your Replicate API key:

```
# Replicate API Key
REPLICATE_API_KEY=your_replicate_api_key_here
```

3. Save the file

## Troubleshooting

If you're still seeing errors:

### OpenRouter Issues
1. Make sure your OpenRouter API key is correct and has not expired
2. Check that you've selected the "GPT-3.5 Turbo" model when creating your key
3. Verify that your OpenRouter account has sufficient credits (new accounts get free credits)

### Replicate Issues
1. Make sure your Replicate API token is correct and has not expired
2. Verify that your Replicate account has sufficient credits (new accounts get free credits)
3. Check that you have access to the models being used (Llama 3)

If all else fails, the application will fall back to mock data for the Science Quiz Generator
