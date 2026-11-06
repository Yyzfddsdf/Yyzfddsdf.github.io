
    (function(){
      'use strict';
      var translations={
        en:{skip:'Skip to content',navAbout:'About',navFocus:'Interests',navBackground:'Background',navContact:'Contact',eyebrow:'A small world. Endless curiosity.',hero:'An undergraduate in <strong>Network Engineering</strong> at <strong>Hangzhou Dianzi University</strong>, with interests in embodied AI, multimodal LLMs, and AI safety.',getInTouch:'Get in touch',aboutLabel:'About me',about:'I am an undergraduate student at Hangzhou Dianzi University, majoring in Network Engineering. My research interests include embodied AI, multimodal large language models, and AI safety. My technical experience includes NSA sparse attention optimization on MetaX C500 using TileLang.',focusLabel:'Research interests',focusHeading:'Ideas worth exploring.',focusAside:'Perception, intelligence, and trust.',embodiedTitle:'Embodied AI',embodiedText:'Intelligent agents that connect perception and action in the physical world.',multimodalTitle:'Multimodal LLMs',multimodalText:'Models that bring language together with visual and other forms of information.',safetyTitle:'AI Safety',safetyText:'Understanding risks and improving the reliability and safety of AI systems.',educationLabel:'Education',university:'Hangzhou Dianzi University',degree:'Undergraduate · Network Engineering',technicalLabel:'Technical background',technicalTitle:'Attention & optimization',technicalText:'Experience with NSA sparse attention optimization on MetaX C500 using TileLang.',contactLabel:'Open a conversation',contactHeading:'Let’s connect.',contactText:'You can reach me by email or find me on GitHub.',footer:'Yizhe Yang · Hangzhou Dianzi University',backTop:'Back to top ↑',worldHint:'Drag to explore this little world',scrollHint:'Scroll to discover',fallback:'This little 3D world needs WebGL. All profile information is available below.'},
        zh:{skip:'跳转到正文',navAbout:'关于',navFocus:'研究兴趣',navBackground:'个人背景',navContact:'联系',eyebrow:'小小世界，无尽好奇。',hero:'我是<strong>杭州电子科技大学网络工程专业</strong>的本科生，研究兴趣包括具身智能、多模态大语言模型与人工智能安全。',getInTouch:'联系我',aboutLabel:'关于我',about:'我是杨艺哲，杭州电子科技大学网络工程专业本科生。我关注具身智能、多模态大语言模型与人工智能安全，技术经历包括使用 TileLang 在 MetaX C500 上开展 NSA 稀疏注意力优化。',focusLabel:'研究兴趣',focusHeading:'我关注的方向',focusAside:'感知、智能与可信。',embodiedTitle:'具身智能',embodiedText:'将感知与行动相结合，在物理世界中进行交互的智能体。',multimodalTitle:'多模态大语言模型',multimodalText:'结合语言、视觉及其他模态信息的模型。',safetyTitle:'人工智能安全',safetyText:'理解人工智能系统的风险，提升其可靠性与安全性。',educationLabel:'教育背景',university:'杭州电子科技大学',degree:'本科生 · 网络工程',technicalLabel:'技术背景',technicalTitle:'注意力机制与优化',technicalText:'使用 TileLang 在 MetaX C500 上进行 NSA 稀疏注意力优化的实践经历。',contactLabel:'联系方式',contactHeading:'保持联系。',contactText:'可以通过电子邮件或 GitHub 找到我。',footer:'杨艺哲 · 杭州电子科技大学',backTop:'返回顶部 ↑',worldHint:'拖动，探索这个小世界',scrollHint:'向下探索',fallback:'这个三维小世界需要 WebGL 支持，个人资料仍可在下方阅读。'}
      };
      var current='en';
      var languageButton=document.getElementById('language');
      var status=document.getElementById('copy-status');
      var timer;
      languageButton.addEventListener('click',function(){
        current=current==='en'?'zh':'en';
        document.documentElement.lang=current==='zh'?'zh-CN':'en';
        document.querySelectorAll('[data-i18n]').forEach(function(node){var key=node.getAttribute('data-i18n');if(key==='hero'){node.innerHTML=translations[current][key];}else{node.textContent=translations[current][key];}});
        languageButton.textContent=current==='zh'?'EN':'中文';
        languageButton.setAttribute('aria-label',current==='zh'?'Switch to English':'Switch to Chinese');
        languageButton.setAttribute('aria-pressed',String(current==='zh'));
        document.getElementById('copy-email').setAttribute('aria-label',current==='zh'?'复制邮箱地址':'Copy email address');
        document.querySelector('nav').setAttribute('aria-label',current==='zh'?'主导航':'Main navigation');
        document.getElementById('background').setAttribute('aria-label',current==='zh'?'教育与技术背景':'Education and technical background');
        document.title=current==='zh'?'杨艺哲 · Yizhe Yang':'Yizhe Yang · 杨艺哲';window.dispatchEvent(new Event('languagechange'));
        clearTimeout(timer);status.textContent='';
      });
      document.getElementById('copy-email').addEventListener('click',async function(){
        var success=false;
        var input=document.createElement('textarea');input.value='2915176064@qq.com';input.style.position='fixed';input.style.left='-9999px';input.setAttribute('aria-hidden','true');document.body.appendChild(input);input.select();
        try{success=document.execCommand('copy');}catch(e){}
        document.body.removeChild(input);document.getElementById('copy-email').focus({preventScroll:true});
        if(!success&&navigator.clipboard&&window.isSecureContext){
          try{await Promise.race([navigator.clipboard.writeText('2915176064@qq.com'),new Promise(function(resolve,reject){setTimeout(function(){reject(new Error('Clipboard unavailable'));},1200);})]);success=true;}catch(e){}
        }
        clearTimeout(timer);
        status.textContent=success?(current==='zh'?'邮箱地址已复制':'Email address copied'):(current==='zh'?'请选中邮箱地址后复制':'Select the email address to copy it');
        timer=setTimeout(function(){status.textContent='';},3500);
      });
    })();
