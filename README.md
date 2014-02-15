# CloudKeePass

CloudKeePass is a web application to view and, soon, edit a KeePass Database file. It executes only on the browser side. There is no server side code.

Some functionnalities:
* Give an URL to download and open the database
* Drag and drop of a local database to open it
* Search through the database
* Click on the URL/username/password to copy in the clipboard (Flash needed)
* Use the groups and tags of the database
* Navigate through the versions of the entries

# Installation

1. CloudKeePass is a SproutCore application. So you must install SproutCore to compile the application:
http://sproutcore.com/install/

2. Then go to the directory where you downloaded the source of CloudKeePass and execute the following command:
`sc-build cloud_kee_pass`

3. Upload at the root directory of your web server the directory `static/` located in `tmp/build/`. You can ignore the directory `static/sproutcore/`.

CloudKeePass will be accessible by the URL http[s]://yourserver.example.com/static/cloud_kee_pass/en/xxxx where xxxx is a hash calculated at the compilation (if the sources change, the hash change).

You can add an alias to your web server configuration. For Apache:
`Alias /CloudKeePass /place/to/your/web/root/static/cloud_kee_pass/en/xxxx`

# Demo

http://web.ledisez.net/CloudKeePass/

You can use your own database (by drag n' drop) or use that test file:
* URL: http://web.ledisez.net/Test.kdbx
* Passphrase: azerty

# TODO

Contributions welcome. This list is not exhaustive and not in any particular order.

* Optimization
* Test and enable the decryption of a database with a key file
* Clean memory after locking the file (/!\ close the tab when you leave, with the JS debugger all data are available /!\)
* Localization/Internationalization
* Clean all the TODO/FIXME in the code
* Download of the embedded files
* Improvement of the drag and drop on the unlock page
* Test IE 10
* Add licence informations (GPLv3)
* Add all icons for a KeePass database (from 0 to 68)
* Make a stripe for all images
* Offline web application
