import dash
from dash import html, dcc, callback, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from wordcloud import WordCloud
import jieba
import json
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import plotly.io as pio
import zhipuai
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import flask
from flask import session, request
import requests
import pymysql
import io
import base64
from PIL import Image

# 加载环境变量
load_dotenv()

# 配置智谱AI API
zhipuai.api_key = os.getenv('ZHIPUAI_API_KEY')

# 初始化Flask应用
server = flask.Flask(__name__)
server.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key')

def sync_user_from_query():
    uid = request.args.get('uid')
    username = request.args.get('username')
    if uid and username:
        session['user_id'] = uid
        session['username'] = username

# 数据库连接
def get_db_connection():
    conn = pymysql.connect(
        host='localhost',      
        user='root',
        password='lzy18762501',
        database='e_rhythm',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn

# 获取当前用户信息
def get_current_user():
    # 从e_rhythm的会话中获取用户信息
    user_id = session.get('user_id')
    if not user_id:
        return None
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM user WHERE id = %s', (user_id,))
            user = cursor.fetchone()
    finally:
        conn.close()
    return user

# 获取用户帖子
def get_user_posts(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM post WHERE user_id = %s', (user_id,))
            posts = cursor.fetchall()
    finally:
        conn.close()
    return posts

# 获取所有帖子
def get_all_posts():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM post')
            posts = cursor.fetchall()
    finally:
        conn.close()
    return posts



# 初始化文本嵌入模型
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
#model = AutoModel.from_pretrained("allenai/scibert_scivocab_cased")
# 生成文本向量
def generate_embeddings(texts):
    return model.encode(texts)
# posts = get_all_posts()
# posts_df = pd.DataFrame(posts)
# columns = ['posttime', 'content']
# posts_df = posts_df[columns]
# posts_df = posts_df.rename(columns={
#     'posttime': 'date',
#     'content': 'content'
# })
# posts_df['vector'] = posts_df['content'].apply(lambda x: generate_embeddings([x])[0])
# print("nihao!!!!!!!!!!!!!!!!!!!!!!\n", posts_df['vector'])
# 设置主题颜色
COLORS = {
    'primary': '#2C5545',  # 黛绿色
    'secondary': '#1B4332',  # 深黛绿
    'background': '#f8f9fa',
    'text': '#2C3E2F',  # 深绿文字
    'accent': '#4A6B5A',  # 浅黛绿
    'success': '#3A7D44',  # 青绿
    'info': '#5B8A72',  # 灰绿
    'warning': '#8B9D77',  # 橄榄绿
    'danger': '#7D4E57'  # 暗红
}

# 自定义样式
CUSTOM_STYLES = {
    'title': {
        'fontSize': '2.5rem',
        'fontWeight': 'bold',
        'color': COLORS['primary'],
        'textAlign': 'center',
        'marginBottom': '2rem',
        'textShadow': '2px 2px 4px rgba(0,0,0,0.1)'
    },
    'subtitle': {
        'fontSize': '1.5rem',
        'color': COLORS['text'],
        'marginBottom': '1.5rem'
    },
    'card': {
        'borderRadius': '15px',
        'boxShadow': '0 4px 6px rgba(0,0,0,0.1)',
        'transition': 'transform 0.3s ease-in-out',
        'marginBottom': '1.5rem',
        'backgroundColor': 'rgba(255, 255, 255, 0.9)'
    },
    'button': {
        'borderRadius': '8px',
        'padding': '10px 20px',
        'fontWeight': 'bold',
        'transition': 'all 0.3s ease',
        'boxShadow': '0 2px 4px rgba(0,0,0,0.1)',
        'backgroundColor': COLORS['primary'],
        'borderColor': COLORS['primary']
    },
    'buttonHover': {
        'transform': 'translateY(-2px)',
        'boxShadow': '0 4px 8px rgba(0,0,0,0.2)',
        'backgroundColor': COLORS['secondary'],
        'borderColor': COLORS['secondary']
    }
}

# 初始化Dash应用
app = dash.Dash(__name__, 
                server=server,
                external_stylesheets=[dbc.themes.BOOTSTRAP],
                suppress_callback_exceptions=True,
                assets_folder='assets')

# 模拟数据生成函数
def generate_sample_data():
    # 生成帖子数据
    posts_data = {
        'date': pd.date_range(start='2024-01-01', end='2024-03-15', freq='D'),
        'content': [f'示例帖子内容 {i}' for i in range(75)],
        'vector': [np.random.rand(3) for _ in range(75)]
    }
    posts_df = pd.DataFrame(posts_data)
    # ...（省略用户数据部分）
    return posts_df, users_df
    users_df = pd.DataFrame(users_data)
    
    return posts_df, users_df

# 生成示例数据
posts_df, users_df = generate_sample_data()
# 创建词云图
def create_wordcloud(text):
    words = ' '.join(jieba.cut(text))
    wordcloud = WordCloud(
        font_path='simhei.ttf',  # 使用中文字体
        width=800,
        height=400,
        background_color='white'
    ).generate(words)
    
    return wordcloud

def wordcloud_to_base64_img(wordcloud):
    img = Image.fromarray(wordcloud.to_array())
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    data = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{data}"

# 创建3D聚类图
def create_3d_cluster(posts_df, date_range=None):
    if date_range:
        mask = (posts_df['date'] >= date_range[0]) & (posts_df['date'] <= date_range[1])
        df = posts_df[mask]
    else:
        df = posts_df
    
    # 生成文本向量
    texts = df['content'].tolist()
    if not texts:
        # 没有数据时返回空图
        fig = go.Figure()
        fig.update_layout(
            title='暂无数据',
            scene=dict(
                xaxis_title='维度1',
                yaxis_title='维度2',
                zaxis_title='维度3'
            ),
            template='plotly_white'
        )
        return fig
    
    vectors = generate_embeddings(texts)

    n_samples = len(vectors)
    # perplexity 必须小于样本数，且大于1
    perplexity = min(30, max(2, n_samples - 1))
    
    # 使用t-SNE进行降维
    tsne = TSNE(n_components=3, random_state=42)
    vectors_3d = tsne.fit_transform(vectors)
    
    # 聚类
    kmeans = KMeans(n_clusters=3, random_state=42)
    clusters = kmeans.fit_predict(vectors_3d)
    
    # 创建3D散点图
    fig = go.Figure(data=[go.Scatter3d(
        x=vectors_3d[:, 0],
        y=vectors_3d[:, 1],
        z=vectors_3d[:, 2],
        mode='markers',
        marker=dict(
            size=8,
            color=clusters,
            colorscale='Viridis',
            opacity=0.8
        ),
        text=df['content'],
        hoverinfo='text'
    )])
    
    fig.update_layout(
        title='帖子内容聚类分析',
        scene=dict(
            xaxis_title='x',
            yaxis_title='y',
            zaxis_title='z'
        ),
        template='plotly_white'
    )
    
    return fig

# 布局组件
def create_navbar():
    return dbc.Navbar(
        dbc.Container([
            dbc.NavbarBrand(
                html.H1("亿韵数据分析平台", style={'fontSize': '1.8rem', 'margin': '0', 'color': 'white'}),
                className="ms-2"
            ),
            dbc.Nav([
                dbc.NavItem(
                    dbc.NavLink(
                        "平台数据分析",
                        href="/",
                        active="exact",
                        className="nav-link-custom"
                    )
                ),
                dbc.NavItem(
                    dbc.NavLink(
                        "用户内容分析",
                        href="/user-analysis",
                        active="exact",
                        className="nav-link-custom"
                    )
                ),
            ], className="ms-auto")
        ]),
        color="primary",
        dark=True,
        className="mb-4 shadow-sm"
    )

# 平台数据分析页面
def create_platform_analysis_layout():
    return html.Div([
        html.H1("平台数据分析", style=CUSTOM_STYLES['title']),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("数据筛选", style=CUSTOM_STYLES['subtitle']),
                        html.Div([
                            html.Label("时间范围", className="mb-2"),
                            dcc.DatePickerRange(
                                id='date-range',
                                start_date=posts_df['date'].min(),
                                end_date=posts_df['date'].max(),
                                className="mb-4",
                                style={'width': '100%'}
                            ),
                            dbc.Button(
                                "更新分析",
                                id="update-analysis",
                                color="primary",
                                className="w-100",
                                style=CUSTOM_STYLES['button']
                            )
                        ])
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(
                            id='cluster-plot',
                            style={'height': '80vh'},
                            config={'displayModeBar': True}
                        )
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=9)
        ])
    ], style={'padding': '2rem'})

# 用户内容分析页面
def create_user_analysis_layout():
    current_user = get_current_user()
    if not current_user:
        return html.Div([
            html.H1("请先登录", style=CUSTOM_STYLES['title']),
            html.A("点击这里登录", href="/login", className="btn btn-primary")
        ])
    
    return html.Div([
        html.H1("用户内容分析", style=CUSTOM_STYLES['title']),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4(f"{current_user['username']}的创作分析", style=CUSTOM_STYLES['subtitle']),
                        html.Div(id='user-analysis-content')
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=12)
        ])
    ], style={'padding': '2rem'})

# 添加自定义CSS
app.index_string = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>亿韵数据分析平台</title>
        {%favicon%}
        {%css%}
        <style>
            body {
                background-image: url('/assets/back.jpg');
                background-size: cover;
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-position: center;
                min-height: 100vh;
            }
            .nav-link-custom {
                font-size: 1.1rem;
                padding: 0.5rem 1rem;
                margin: 0 0.5rem;
                border-radius: 5px;
                transition: all 0.3s ease;
                color: rgba(255,255,255,0.9) !important;
            }
            .nav-link-custom:hover {
                background-color: rgba(255,255,255,0.1);
                transform: translateY(-2px);
                color: white !important;
            }
            .card {
                transition: transform 0.3s ease-in-out;
                backdrop-filter: blur(5px);
            }
            .card:hover {
                transform: translateY(-5px);
            }
            .btn {
                transition: all 0.3s ease;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .dropdown-menu {
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                backdrop-filter: blur(5px);
            }
            .dropdown-item:hover {
                background-color: rgba(44, 85, 69, 0.1);
                transform: translateX(5px);
                transition: all 0.3s ease;
            }
            .navbar {
                background-color: rgba(44, 85, 69, 0.9) !important;
                backdrop-filter: blur(5px);
            }
            .date-picker {
                background-color: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                padding: 10px;
            }
            .Select-control {
                background-color: rgba(255, 255, 255, 0.9) !important;
                border-radius: 8px !important;
            }
            .Select-menu-outer {
                background-color: rgba(255, 255, 255, 0.95) !important;
                border-radius: 8px !important;
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
'''

# 主布局
app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    create_navbar(),
    html.Div(id='page-content')
])

# 回调函数
@app.callback(
    Output('page-content', 'children'),
    Input('url', 'pathname')
)
def display_page(pathname):
    if pathname == '/user-analysis':
        return create_user_analysis_layout()
    else:
        return create_platform_analysis_layout()

@app.callback(
    Output('cluster-plot', 'figure'),
    Input('update-analysis', 'n_clicks'),
    State('date-range', 'start_date'),
    State('date-range', 'end_date')
)
def update_cluster_plot(n_clicks, start_date, end_date):
    if n_clicks is None or not start_date or not end_date:
        return create_3d_cluster(posts_df)
    # 兼容多种日期格式
    try:
        date_range = [datetime.fromisoformat(start_date), datetime.fromisoformat(end_date)]
    except Exception:
        try:
            date_range = [
                datetime.strptime(start_date, '%Y-%m-%d %H:%M:%S'),
                datetime.strptime(end_date, '%Y-%m-%d %H:%M:%S')
            ]
        except Exception:
            date_range = [
                datetime.strptime(start_date, '%Y-%m-%d'),
                datetime.strptime(end_date, '%Y-%m-%d')
            ]
    return create_3d_cluster(posts_df, date_range)

@app.callback(
    Output('user-analysis-content', 'children'),
    Input('url', 'pathname')
)
def update_user_analysis(pathname):
    current_user = get_current_user()
    if not current_user:
        return html.Div("请先登录")
    
    # 获取用户帖子
    posts = get_user_posts(current_user['id'])
    if not posts:
        return html.Div("您还没有发布任何帖子")
    
    # 合并所有帖子内容
    all_content = " ".join([post['content'] for post in posts])
    
    # 创建词云
    wordcloud = create_wordcloud(all_content)
    
    # 调用智谱AI API进行内容分析
    try:
        response = zhipuai.model_api.invoke(
            model="glm-4-plus",
            prompt=[
                {"role": "system", "content": "你是一个专业的文学分析助手，擅长分析用户的创作内容和风格特点。"},
                {"role": "user", "content": f"请分析以下用户的创作内容，从创作风格、意象运用、情感表达等方面给出专业评价：\n\n{all_content}"}
            ],
            temperature=0.7,
            top_p=0.7,
            max_tokens=500
        )
        ai_analysis = response['data']['choices'][0]['content']
    except Exception as e:
        ai_analysis = f"AI分析暂时无法使用，请稍后再试。错误信息：{str(e)}"
    
    return html.Div([
        dbc.Row([
            dbc.Col([
                html.H4("内容词云分析", className="mb-3"),
                #html.Img(src=wordcloud.to_array(), className="img-fluid")
                html.Img(src=wordcloud_to_base64_img(wordcloud), className="img-fluid")
            ], width=6),
            dbc.Col([
                html.H4("AI创作评价", className="mb-3"),
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.H5("创作风格分析", className="mb-3"),
                            html.P(ai_analysis, className="mb-0", style={'whiteSpace': 'pre-line'})
                        ])
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=6)
        ])
    ])

# 运行应用
if __name__ == '__main__':
    app.run(debug=True, port=8080) 