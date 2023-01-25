import { ArgumentParser } from 'argparse';
import { exit } from 'process';
import { version } from '../package.json';
import { migrate, getData } from './Connectors';
import { app } from './Server/app';

const parser = new ArgumentParser({
  description: 'this is the CLI for the internship test project',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-m', '--migrate', { help: 'given a CSV file, will migrate all its data to the MONGO REALM database, note that the credentials need to be in the env file' });
parser.add_argument('-r', '--run', { help: 'given a port, runs the API server for querying the MONGO REALM database', default: 3000, type: 'int' });

const args = parser.parse_args();

const main = async () => {
  if (args.migrate) {
    const data = await getData(args.migrate);
    await migrate(data);
    console.log(data);
  }

  if (args.run) {
    const port = parseInt(args.run, 10);
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  }

  if (!args.migrate && !args.run) {
    parser.print_help();
    exit();
  }
};


(async () => {
  await main();
})();