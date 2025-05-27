# 亿韵启界  E_rhythm

 **E_rhythm** project deeply integrates advanced AI technology and data analytics into traditional Chinese poetry creation, establishing a modern platform that combines creation, sharing, and interaction. This platform provides users with a novel poetic experience and drives the digital dissemination of traditional Chinese culture.



## Program structure

** Only crucial parts are listed down below*

- [**Main Module**](https://github.com/ZyanNo1/E_rhythm/tree/main/main) - Primary Node.js Web Application
  - routes - Express.js route handlers
  - models - Data access layers
  - views -  EJS template files with assets
  - **app.js** - Express application entry point
- **[MixPoet Module](https://github.com/ZyanNo1/E_rhythm/tree/main/MixPoet-master)** - AI Poetry Generation Module
  - checkpoint - Trained model weights [[download link](https://pan.baidu.com/s/1yZ3th_txKTFR8PPvRDErtQ?pwd=7897)]
  - codes - Core poetry generation source code

    - **app.py** - MixPoet application entry point
  - corpus - Poetry corpus and vocabulary
  - data - Additional poetry data resources
  - preprocess - Data preprocessing utilities

- **[Data Analysis Module](https://github.com/ZyanNo1/E_rhythm/tree/main/data_analysis)** - Flask Data Analysis Platform
  - **app.py** - Dash application main file

- While running, Main Module is on port 3000, MixPoet Module on port 5000, Data Analysis Module on port 8050.

## Database Schema

- User

  ```
  user
  ├── id (int)                     # Primary key
  ├── username (varchar(200))      # Username
  ├── email (varchar(50))          # User email
  ├── password (varchar(200))      # Encrypted password
  ├── regtime (datetime)           # Registration timestamp
  ├── goodpostNum (int)            # Number of quality posts
  ├── introduction (varchar(300))  # Personal introduction
  ├── contribution (int)           # Contribution value
  ├── post_num (int)               # Total post count
  └── avatar (varchar(255))        # Avatar image path
  ```

- Post

  ```
  post
  ├── id (int)                     # Primary key
  ├── uid (int)                    # Foreign key to user.id
  ├── content (varchar(1000))      # Post content
  ├── title (varchar(100))         # Post title
  ├── posttime (datetime)          # Publication timestamp
  ├── like (int)                   # Like status flag
  ├── collection (int)             # Collection status flag
  ├── type (int)                   # Post type
  ├── like_count (int)             # Likes counter
  └── collection_count (int)       # Collections counter
  ```

- User Post Actions

  ```
  user_post_actions
  ├── id (int, auto increment)     # Primary key
  ├── post_id (int)                # Foreign key to post.id
  ├── user_id (int)                # Foreign key to user.id
  ├── is_liked (tinyint(1))        # Like status
  ├── is_collected (tinyint(1))    # Collection status
  └── created_at (timestamp)       # Action timestamp, defaults to current time
  ```

- Reply

  ```
  reply
  ├── id (int)                     # Primary key
  ├── pid (int)                    # Foreign key to post.id
  ├── uid (int)                    # Foreign key to user.id
  ├── content (varchar(1000))      # Reply content
  └── posttime (datetime)          # Reply timestamp
  ```

- Poetry Imagery Encyclopedia 

  ```
  yixiang
  ├── id (int, auto increment)     # Primary key
  ├── name (varchar(50))           # Name
  ├── body (varchar(100))          # Essence of imagery
  ├── meaning (varchar(255))       # Meaning explanation
  ├── example (text)               # Usage examples
  └── category (varchar(50))       # Category
  ```

  

## **Acknowledgements**

This project incorporates MixPoet, an AI poetry generation framework developed by the THUNLP-AIPoet team at Tsinghua University, and trained on our own. We express our sincere gratitude to the researchers for making this exceptional work publicly available.

***References:***

- Repository: https://github.com/THUNLP-AIPoet/MixPoet

- Citation: Xiaoyuan Yi, Ruoyu Li, Cheng Yang, Wenhao Li and Maosong Sun. 2020. MixPoet: Diverse Poetry Generation via Learning Controllable Mixed Latent Space. In *Proceedings of The Thirty-Fourth AAAI Conference on Artificial Intelligence*, New York, USA.

