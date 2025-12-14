### Issue Description: 
Date: 2025, Dec 14th. 
Problem: React-DOM Client Development.JS:3891, Uncaught Error, Maximum Update Depth Exceeded. \
Details: Component repeatedly calls setState inside componentWillUpdate or componentDidUpdate, react limits the number of nested updates to prevent infinite loops.  

Step 1: User types in description field and calls
```
setFolderDescription("Hello")
```
Step 2: useDeferredValue defers it 
```
const deferredDescription = useDeferreValue(folderDescription)
```
Step 3: Save effect triggers \
deferredDescription changed so we save it to our database. First argument is the "effect" that will execute, so we are going to update the Folder, folderId is defined in our backeend, description will become deferredDescription. The second argument closed by the [ ] bracket is the dependency array, this is an array of values. The effect will re-run whenever any value in this array changes.
```
useEffect(( => { 
    await updateFolder(folderId, {description: deferredDescription}, [deferredDescription, folder?.description, folderId, updateFolder])
}))
```

Step 4: Folder updates in database 
- `updateFolder` saves hello to the database, workspacecontext refetches folders, the `folders` array gets a new folder object. 

Step 5: Folder object reference changes 
```
const folder = useMemo(() => folders.find(f => f.id === folderid))
```

Step 6: Sync effect triggers 
``` 
useEffect(() => {
    if (folder) {
        setFolderDesription(folder.description || '')
    }
}, [folder])
``` 

Step 7: Loop Continues \
the sync event in step 6 causes 