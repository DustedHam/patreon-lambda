# Patreon Lambda Webhook
This is a simple script for handling a [Patreon] webhook with AWS lambda to store the user's Vanity name in an AWS dynamoDB for use by other application.
 
## Setup
In order for this script to work you'll need to first create a dynamoDB and give your Lambda `PutItem, DeleteItem` and `UpdateItem` permissions for the database. 

### Environment Variables
| Name        | description           | example  |
| ------------- |-------------| ----- |
| PATREON_SECRET     | Key used for checking the validity of the event, given too you by Patreon |  |
| REGION    | Region your dynamoDB is located    | us-east-1 |
| TABLE_NAME | Name of you dynamoDB table    | db-patreon |


[Patreon]:https://www.patreon.com/SaltboxGames