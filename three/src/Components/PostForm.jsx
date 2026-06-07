import React, {useState} from "react";
import MyInput from "./UI/input/MyInput"; // Путь может отличаться, проверьте папку
import MyButton from "./UI/button/MyButton"; // Путь может отличаться, проверьте папку

const PostForm = ({create}) => {
    const [post, setPost] = useState({title: '', body: ''})

    const addNewPost = (e) => {
        e.preventDefault()
        const newPost = {
            ...post, id: Date.now()
        }
        create(newPost) //Дисптруктиризация
        setPost({title: '', body: ''})
    }

    return (
        <form>
            {/* Управляемый копонент */}
            <MyInput 
                value={post.title} //Передача названия в обьект
                onChange={e => setPost({...post, title: e.target.value})} //Считывание инпута
                type="text" 
                placeholder="Название Поста"
            />
                    {/*Неуправляеммый копонент */}
            <MyInput 
                value={post.body} //Передача названия в обьект
                 onChange={e => setPost({...post, body: e.target.value})} //Считывание инпута
                type="text" 
                placeholder="Описание Поста"
                />
            <MyButton onClick={addNewPost}>Создать пост</MyButton>
        </form>
    );
};

export default PostForm;