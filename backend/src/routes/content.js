const express = require('express');
const OpenAI = require('openai');
const { auth, optionalAuth } = require('../middleware/auth');
const db = require('../database/mysql-db');
const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate text content using OpenAI
router.post('/generate-text', auth, async (req, res) => {
  try {
    const { type, prompt, project_id, params = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Create system prompt based on content type
    let systemPrompt = '';
    switch (type) {
      case 'article':
        systemPrompt = 'You are a professional content writer. Create well-structured, engaging articles with proper headings and paragraphs.';
        break;
      case 'social_post':
        systemPrompt = 'You are a social media expert. Create engaging, concise posts optimized for social media platforms.';
        break;
      case 'video_script':
        systemPrompt = 'You are a professional scriptwriter. Create engaging video scripts with clear dialogue and scene descriptions.';
        break;
      case 'email':
        systemPrompt = 'You are an email marketing specialist. Create compelling email content that drives engagement.';
        break;
      case 'seo_content':
        systemPrompt = 'You are an SEO expert. Create content that is optimized for search engines while maintaining readability.';
        break;
      default:
        systemPrompt = 'You are a helpful AI assistant that creates high-quality content.';
    }

    // Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: params.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: params.maxTokens || 1000,
      temperature: params.temperature || 0.7,
    });

    const generatedContent = completion.choices[0].message.content;
    const wordCount = generatedContent.split(/\s+/).length;

    // Update user usage
    const currentUsage = db.getUsageByUser(req.user.id);
    if (currentUsage) {
      db.updateUsage(req.user.id, {
        words_generated: currentUsage.words_generated + wordCount
      });
    }

    // If project_id is provided, update the project
    if (project_id) {
      const project = db.getProjectById(project_id);
      if (project && project.created_by === req.user.id) {
        db.updateProject(project_id, {
          content: generatedContent,
          word_count: wordCount,
          status: 'completed'
        });
      }
    }

    res.json({
      content: generatedContent,
      word_count: wordCount,
      type,
      model_used: params.model || 'gpt-3.5-turbo',
      usage: {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Content generation error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        message: 'OpenAI API quota exceeded. Please check your API key or billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        message: 'Invalid OpenAI API key.' 
      });
    }

    res.status(500).json({ 
      message: 'Error generating content',
      error: error.message 
    });
  }
});

// Generate images using OpenAI DALL-E
router.post('/generate-image', auth, async (req, res) => {
  try {
    const { prompt, style = 'natural', project_id, params = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    switch (style) {
      case 'photographic':
        enhancedPrompt = `${prompt}, photorealistic, high quality photography`;
        break;
      case 'digital_art':
        enhancedPrompt = `${prompt}, digital art, highly detailed`;
        break;
      case 'illustration':
        enhancedPrompt = `${prompt}, illustration, clean lines, vibrant colors`;
        break;
      case 'abstract':
        enhancedPrompt = `${prompt}, abstract art, creative interpretation`;
        break;
    }

    // Generate image with OpenAI DALL-E
    const response = await openai.images.generate({
      model: params.model || 'dall-e-3',
      prompt: enhancedPrompt,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      n: 1,
    });

    const imageUrl = response.data[0].url;

    // Update user usage
    const currentUsage = db.getUsageByUser(req.user.id);
    if (currentUsage) {
      db.updateUsage(req.user.id, {
        image_tokens: currentUsage.image_tokens + 1
      });
    }

    // If project_id is provided, update the project metadata
    if (project_id) {
      const project = db.getProjectById(project_id);
      if (project && project.created_by === req.user.id) {
        const metadata = project.metadata || {};
        metadata.generated_images = metadata.generated_images || [];
        metadata.generated_images.push({
          url: imageUrl,
          prompt: enhancedPrompt,
          style,
          created_at: new Date().toISOString()
        });
        
        db.updateProject(project_id, { metadata });
      }
    }

    res.json({
      image_url: imageUrl,
      prompt: enhancedPrompt,
      original_prompt: prompt,
      style,
      model_used: params.model || 'dall-e-3',
      size: params.size || '1024x1024'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        message: 'OpenAI API quota exceeded. Please check your API key or billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        message: 'Invalid OpenAI API key.' 
      });
    }

    res.status(500).json({ 
      message: 'Error generating image',
      error: error.message 
    });
  }
});

// Get content templates
router.get('/templates', optionalAuth, (req, res) => {
  const templates = [
    {
      id: 'blog-post',
      title: 'Blog Post',
      description: 'Create engaging blog posts with proper structure',
      type: 'article',
      prompt_template: 'Write a comprehensive blog post about {topic}. Include an engaging introduction, well-structured main points, and a compelling conclusion.'
    },
    {
      id: 'social-media',
      title: 'Social Media Post',
      description: 'Create viral social media content',
      type: 'social_post',
      prompt_template: 'Create an engaging social media post about {topic}. Make it catchy, include relevant hashtags, and encourage engagement.'
    },
    {
      id: 'product-description',
      title: 'Product Description',
      description: 'Write compelling product descriptions',
      type: 'article',
      prompt_template: 'Write a compelling product description for {product}. Highlight key features, benefits, and why customers should buy it.'
    },
    {
      id: 'email-newsletter',
      title: 'Email Newsletter',
      description: 'Create engaging email newsletters',
      type: 'email',
      prompt_template: 'Create an email newsletter about {topic}. Include a catchy subject line, engaging content, and a clear call-to-action.'
    }
  ];

  res.json(templates);
});

// Analyze content for SEO
router.post('/analyze-seo', auth, async (req, res) => {
  try {
    const { content, target_keywords = [] } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Use OpenAI to analyze SEO
    const prompt = `Analyze the following content for SEO optimization. 
    Target keywords: ${target_keywords.join(', ')}
    
    Content:
    ${content}
    
    Please provide:
    1. SEO score (1-100)
    2. Keyword density analysis
    3. Suggestions for improvement
    4. Missing elements
    
    Respond in JSON format.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an SEO expert. Analyze content and provide actionable SEO recommendations in JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, return the raw analysis
      analysis = {
        seo_score: 75,
        analysis: completion.choices[0].message.content,
        suggestions: ['Review the detailed analysis provided']
      };
    }

    res.json(analysis);

  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing content for SEO',
      error: error.message 
    });
  }
});

module.exports = router;