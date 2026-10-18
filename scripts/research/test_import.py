import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('import_qq', Path(__file__).with_name('import_qq.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SanitizerTests(unittest.TestCase):
    def test_untrusted_markup(self):
        parser = module.ArticleHTML()
        parser.feed('<p onclick="steal()">保留<strong>重点</strong></p><script>alert(1)</script><iframe src="https://bad.example">bad</iframe><a href="javascript:steal()">链接</a><img src="https://inews.gtimg.com/a.png" onerror="steal()">')
        body, text = parser.result()
        self.assertIn('保留', text)
        self.assertIn('<strong>重点</strong>', body)
        self.assertNotIn('steal', body)
        self.assertNotIn('alert', body)
        self.assertNotIn('iframe', body)
        self.assertNotIn('javascript', body)
        self.assertEqual(parser.images, 1)

    def test_urls(self):
        self.assertEqual(module.safe_url('http://inews.gtimg.com/1', image=True), 'https://inews.gtimg.com/1')
        for value in ['javascript:alert(1)', 'data:text/html,bad', 'https://inews.gtimg.com.evil.example/a', 'https://user:password@inews.gtimg.com/a']:
            self.assertEqual(module.safe_url(value, image=True), '')

    def test_emoji_and_lazy_image(self):
        parser = module.ArticleHTML()
        parser.feed('<img class="we-emoji" src="data:image/png;base64,a" alt="🎁"><img data-src="https://inews.gtimg.com/test.png" src="data:image/png;base64,a">')
        body, text = parser.result()
        self.assertIn('🎁', text)
        self.assertNotIn('base64', body)
        self.assertEqual(parser.images, 1)

if __name__ == '__main__':
    unittest.main()
