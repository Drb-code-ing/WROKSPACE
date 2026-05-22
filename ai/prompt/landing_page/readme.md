# Landing Page (落地页)

 - 行业经验
   当用户第一次看到这个产品时，这个页面应该怎么讲故事，建立信任，促进下载
   landing page
   1. 详细的，好看的展示内容
   2. url 方便分享，二维码方便扫描
   3. SEO 搜索引擎优化 google/baidu流量

## Prompt
  - 方式
    1. 五个构建块 + 详细描述 + 主题划分  一次性的Prompt

    2. vibe coding 的方式 逐步引导llm 完成工作 边写边改
     - 为一款名为Foodiez的外卖送餐手机应用编写一个落地页代码
     
     上一轮中，豆包产出了纯html/css/js代码，对于快速原型没有问题。但是真想变成一个接近生产环境的结果，
     要技术栈比如 react + ts + tailwindcss, 成为落地页项目工程

     AIGC chat 并复制代码升级为 ai coding agent
     不用离开编辑器就可以完成工作

## Prompt 设计
   1. 任务描述(input)
   2. 最终目标(output)
   3. 技术栈
   4. 风格和视觉方向(style)
   5. 页面结构(layout)
   6. 交付内容

   ```
    Build a modern, responsive landing page for a food delivery mobile
    app called “Foodiez”.
    
    GOAL
    Create a high-conversion marketing landing page that promotes the app, communicates value instantly, and drives users to download the app.
    
    TECH STACK
    Use:
    - React + TypeScript
    - Tailwind CSS
    - Framer Motion for animations
    - Component-based architecture
    - Mobile-first responsive layout
    - Accessible semantic HTML
    
    The result must be production-ready.
    
    STYLE & VISUAL DIRECTION
    - Clean, modern, premium UI
    - Bright and appetizing food delivery aesthetic
    - Primary color: Orange (#FF6B35)
    - Neutrals: white, light gray backgrounds
    - Soft shadows, large border radius (2xl)
    - Smooth micro-interactions
    - Use high-quality food imagery placeholders
    - Typography: bold, friendly, highly readable
    - Spacious layout with clear visual hierarchy
    
    PAGE STRUCTURE
    
    1) NAVBAR
    - Logo: Foodiez
    - Links: How it works, Restaurants, Reviews, Download
    - Sticky on scroll
    - CTA button: “Get the App”
    
    2) HERO SECTION
    Left:
    - Headline: “Your favorite food, delivered fast”
    - Subtext explaining the core value
    - App Store + Google Play buttons
    - Trust indicators (rating, delivery time, number of restaurants)
    
    Right:
    - iPhone mockup showing the app UI
    - Floating animated food cards or delivery status elements
    
    3) SOCIAL PROOF
    - Row of partner restaurant logos
    - Short testimonial cards with avatar, name, and quote
    - Star ratings
    
    4) HOW IT WORKS (3 STEPS)
    Each step includes:
    - Icon or illustration
    - Title
    - Short description
    
    Steps:
    Browse restaurants → Order in seconds → Fast delivery
    
    5) FEATURE HIGHLIGHTS
    Alternating two-column layout with image + text:
    
    Features:
    - Real-time order tracking
    - Personalized recommendations
    - Lightning-fast checkout
    - Exclusive local restaurants
    
    Include subtle scroll-triggered animations.
    
    6) APP PREVIEW SECTION
    - Horizontal scrollable phone mockups
    - Each screen highlights a key app capability
    
    7) PROMO BANNER
    - “Free delivery on your first order”
    - Strong visual emphasis
    - CTA button
    
    8) FINAL CTA SECTION
    - Large bold text
    - “Download Foodiez and get your food faster than ever”
    - App store buttons
    - Gradient or colored background
    
    9) FOOTER
    - Logo
    - Navigation links
    - Social icons
    - App download buttons
    - Copyright
    
    ANIMATIONS & INTERACTIONS
    - Smooth scroll behavior
    - Fade/slide-in on viewport
    - Hover states for buttons and cards
    - Parallax or floating elements in hero
    - Button press micro-interactions
    
    RESPONSIVENESS
    - Fully optimized for mobile, tablet, and desktop
    - Stack sections vertically on small screens
    - Maintain strong spacing and readability
    
    ACCESSIBILITY
    - Proper heading hierarchy
    - Alt text for images
    - Visible focus states
    - WCAG-compliant color contrast
    
    DELIVERABLE
    Return:
    - Clean structured React components
    - Reusable UI sections
    - Tailwind styling
    - Framer Motion animation implementation
    - No placeholder lorem ipsum — use realistic marketing 
    copy for a food delivery product

   ```


## claude code
    
