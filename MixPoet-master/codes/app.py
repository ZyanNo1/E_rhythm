from flask import Flask, request, jsonify
from flask_cors import CORS
from generator import Generator
from generate import parse_args

app = Flask(__name__)
CORS(app)

@app.route('/process', methods=['POST'])
def process():
    print('接受到访问请求')
    args = parse_args()
    beam_siz = args.bsize
    verbos = args.verbose
    man = True if args.select == 1 else False
    model = Generator()
    input_text = request.json.get('inputText')
    print(f"接受字符串为 {input_text}")
    lengt = int(input_text[0])
    factor1 = int(input_text[1])
    factor2 = int(input_text[2])
    key = input_text[3:]
    poem, info = model.generate_one(keyword=key, length=lengt, factor_label1=factor1, factor_label2=factor2, beam_size=beam_siz, verbose=verbos, manu=man)
    poem = '\n'.join(poem)
    print("处理完毕")
    return jsonify({'result': poem})  # 返回处理结果给Express应用

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # 在端口5000上运行Flask应用
