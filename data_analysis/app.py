import dash
from dash import html, dcc, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime
from wordcloud import WordCloud
import jieba
import io
import base64
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE

# 主题色和样式
COLORS = {
    'primary': '#2C5545',
    'secondary': '#1B4332',
    'background': '#f8f9fa',
    'text': '#2C3E2F',
    'accent': '#4A6B5A',
    'success': '#3A7D44',
    'info': '#5B8A72',
    'warning': '#8B9D77',
    'danger': '#7D4E57'
}
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
    }
}

# 1. 生成示例数据
def generate_sample_data():
    posts_data = {
        'date': pd.date_range(start='2024-01-01', end='2024-03-15', freq='D'),
        'content': [f'示例帖子内容 {i}' for i in range(75)],
        'vector': [np.random.rand(3) for _ in range(75)]
    }
    posts_df = pd.DataFrame(posts_data)
    return posts_df

posts_df = generate_sample_data()

# 2. 词云相关
def create_wordcloud(text):
    words = ' '.join(jieba.cut(text))
    wordcloud = WordCloud(
        font_path='simhei.ttf',
        width=800,
        height=400,
        background_color='white'
    ).generate(words)
    return wordcloud

def wordcloud_to_base64_img(wordcloud):
    from PIL import Image
    img = Image.fromarray(wordcloud.to_array())
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    data = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{data}"

# 3. 3D聚类图
def create_3d_cluster(posts_df, date_range=None):
    if date_range:
        mask = (posts_df['date'] >= date_range[0]) & (posts_df['date'] <= date_range[1])
        df = posts_df[mask]
    else:
        df = posts_df

    if df.empty:
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

    # 用已有vector列
    vectors = np.stack(df['vector'].values)
    n_samples = len(vectors)
    perplexity = min(30, max(2, n_samples - 1))
    tsne = TSNE(n_components=3, random_state=42, perplexity=perplexity)
    vectors_3d = tsne.fit_transform(vectors)
    kmeans = KMeans(n_clusters=3, random_state=42)
    clusters = kmeans.fit_predict(vectors_3d)

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

# 4. Dash布局
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

def create_user_analysis_layout():
    # 用示例数据
    all_content = " ".join(posts_df['content'].tolist())
    wordcloud = create_wordcloud(all_content)
    ai_analysis = "这是示例AI分析：内容风格多样，表达流畅，意象丰富。"
    return html.Div([
        html.H1("用户内容分析", style=CUSTOM_STYLES['title']),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("内容词云分析", className="mb-3"),
                        html.Img(src=wordcloud_to_base64_img(wordcloud), className="img-fluid")
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("AI创作评价", className="mb-3"),
                        html.P(ai_analysis, className="mb-0", style={'whiteSpace': 'pre-line'})
                    ])
                ], style=CUSTOM_STYLES['card'])
            ], width=6)
        ])
    ], style={'padding': '2rem'})

# Dash应用
app = dash.Dash(__name__,
                external_stylesheets=[dbc.themes.BOOTSTRAP],
                suppress_callback_exceptions=True,
                assets_folder='assets')

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

app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    create_navbar(),
    html.Div(id='page-content')
])

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

if __name__ == '__main__':
    app.run(debug=True, port=8050)