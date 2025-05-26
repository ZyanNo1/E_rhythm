//时间转换
module.exports={ 
    transformer:function(time) {
        let date = new Date(time);
        let y = date.getFullYear();
        let m = date.getMonth() + 1;
        m = m < 10 ? "0" + m : m;
        let d = date.getDate();
        d = d < 10 ? "0" + d : d;
        let h = date.getHours();
        h = h < 10 ? "0" + h : h;
        let minute = date.getMinutes();
        minute = minute < 10 ? "0" + minute : minute;
        let s = date.getSeconds();
        s = s < 10 ? "0" + s : s;
        return y + "-" + m + "-" + d + " " + h + ":" + minute + ":" + s;

    }
}