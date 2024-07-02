# Davidson Data Visualization Lab

Home of the Davidson Data Visualization Lab, led by Dr. Katy Williams.


## Adding a news post

To add a news/blog post, you will need to checkout `main` and create a new branch.
To do this, copy the link for this repository. In your terminal, do `git clone <url>` (where the url is replaced, without the <>).
You should see a new directory appear called `Davidson-Data-Vis-Lab`.

```
git clone <url>
ls
# You should see the Davidson-Data-Vis-Lab directory
cd Davidson-Data-Vis-Lab
```
You should see the contents of the website.

Next, we will create a branch and add your content. Start by creating a new branch.
Name the branch after your name and the topic, like `williams-swim-vis `:
```
git checkout -b williams-swim-vis
```

Once you have a local branch, we can make changes. Go to the `news/` directory and make a copy of
`template.md`:
```
cd news/
cp template.md my-file-name.md
```
where `my-file-name.md` is replaced with a filename with your name and topic, like  `williams-swim-vis.md`.

Open your newly created Markdown (`.md`) file. You will see some content in there already -- you will need to edit
or remove that content and replace it with your blog post.

After you have saved your changes, you will need to add the changes, commit them, and submit a pull request:
```
# From the root of the Davidson-Data-Vis repo
git add .   # this grabs any changes within the directory, even nested changes
git commit -m "Message about the changes"
git push
```

After this, you should be able to copy-paste the GitHub link your terminal gives you into a web browser to 
open a new pull request. You should tag Dr. Williams in the pull request and she will review it and merge it.
