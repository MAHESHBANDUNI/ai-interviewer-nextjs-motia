"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

const RichTextEditor = ({ value, onChange, error }) => {
    const modules = {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link"],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
    };
    
    const formats = [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "indent",
      "blockquote",
      "code-block",
      "link",
      "align",
      "color",
      "background",
    ];
  return (
    <div
      className={`border rounded-[6px] ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    >
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Enter content..."
        className="min-h-[250px]"
      />
    </div>
  );
};

export default RichTextEditor;
